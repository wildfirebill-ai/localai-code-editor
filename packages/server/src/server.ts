import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, join, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { WebSocketServer, WebSocket } from 'ws';
import { OpenAICompatProvider, ProviderRegistry, type ChatMessage } from '@localai/provider';
import { McpHost, type McpServerConfig } from '@localai/mcp';
import { GitService } from '@localai/git';
import { LanguageServerHost } from '@localai/lsp';
import { runAgent, builtinTools, defaultSystemPrompt, type Tool } from '@localai/agent';
import { SkillStore, defaultUserSkillsDir } from '@localai/skills';
import { WorkspaceFs } from './fs.js';
import { resolveWebDist } from './webdist.js';
import { saveProviderOverrides } from './config.js';
import { readFile } from 'node:fs/promises';
import type { ServerConfig } from './config.js';

type RpcParams = Record<string, unknown>;

/**
 * Directory of the current module in both ESM (tsc) and CJS (esbuild) output —
 * same trick as webdist.ts.
 */
function moduleDir(): string | null {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
}

/** Built-in skills shipped with the editor (env override for packaged apps). */
function builtinSkillsDir(): string | undefined {
  if (process.env.LOCALAI_SKILLS_DIR) return process.env.LOCALAI_SKILLS_DIR;
  const dir = moduleDir();
  if (!dir) return undefined;
  const candidate = join(dir, '..', '..', 'skills', 'builtin');
  return existsSync(candidate) ? candidate : undefined;
}

export class EditorServer {
  readonly providerRegistry: ProviderRegistry;
  readonly mcpHost: McpHost;
  git: GitService;
  fs: WorkspaceFs;
  skills: SkillStore;
  lsp: LanguageServerHost;
  /** In-flight agent runs keyed by connection, so clients can cancel them. */
  private readonly runControllers = new Map<WebSocket, AbortController>();
  private readonly http: ReturnType<typeof createServer>;
  private readonly wss: WebSocketServer;

  constructor(readonly config: ServerConfig) {
    this.providerRegistry = new ProviderRegistry(config.providers);
    this.mcpHost = new McpHost();
    this.git = new GitService(config.workspace);
    this.fs = new WorkspaceFs(config.workspace);
    this.skills = new SkillStore();
    this.lsp = new LanguageServerHost(config.workspace, config.languageServers);
    void this.skills.load({
      projectDir: config.workspace,
      userDir: defaultUserSkillsDir(homedir()),
      builtinDir: builtinSkillsDir(),
    });

    this.http = createServer((req, res) => this.handleHttp(req, res));
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on('connection', (ws) => this.handleConnection(ws));

    this.http.on('upgrade', (req, socket, head) => {
      const url = req.url ?? '';
      // Language-server sockets are routed to the LSP host; all else is the main RPC socket.
      const lspMatch = url.match(/^\/lsp\/([^/]+)/);
      if (lspMatch) {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          void this.lsp.attach(ws, decodeURIComponent(lspMatch[1])).catch((err) => {
            console.error(`LSP attach ${lspMatch[1]} failed:`, err.message);
            ws.close();
          });
        });
        return;
      }
      this.wss.handleUpgrade(req, socket, head, (ws) => this.wss.emit('connection', ws, req));
    });
  }

  /**
   * Resolve the tools available to the agent for a given run. Built-in tools
   * plus any tools from currently-connected MCP servers plus the skill tool.
   * Resolved fresh each run so newly-connected MCP servers take effect.
   */
  private agentTools(): Tool[] {
    const tools: Tool[] = builtinTools(this.fs);

    for (const mcpTool of this.mcpHost.listTools()) {
      tools.push({
        definition: {
          name: mcpTool.name,
          description: mcpTool.description ?? `MCP tool from ${mcpTool.server}`,
          inputSchema: mcpTool.inputSchema,
        },
        execute: async (args) => {
          const res = await this.mcpHost.callTool(mcpTool.name, args);
          return {
            toolCallId: '',
            ok: res.ok,
            content: typeof res.content === 'string' ? res.content : JSON.stringify(res.content),
          };
        },
      });
    }

    tools.push(this.readSkillTool());
    return tools;
  }

  /** Tool that lets the agent pull a skill's full content on demand. */
  private readSkillTool(): Tool {
    return {
      definition: {
        name: 'read_skill',
        description:
          'Load a skill by name and return its full instructions. Call this to activate a skill mentioned in the system prompt before doing related work.',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string', description: 'The skill name to load.' } },
          required: ['name'],
        },
      },
      execute: async (args) => {
        const name = String(args.name ?? '');
        const skill = this.skills.get(name);
        if (!skill) return { toolCallId: '', ok: false, content: `Unknown skill: ${name}` };
        return { toolCallId: '', ok: true, content: skill.content };
      },
    };
  }

  /** Build the system prompt with the active skills' awareness section. */
  private buildSystemPrompt(base: string): string {
    const enabled = this.skills.enabled();
    if (!enabled.length) return base;
    const listing = enabled.map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ''}`).join('\n');
    return [
      base,
      '',
      'Available skills (call read_skill with the name to load full instructions when relevant):',
      listing,
    ].join('\n');
  }

  async start(): Promise<void> {
    await Promise.all(
      Object.entries(this.config.mcpServers).map(([name, cfg]) =>
        this.mcpHost.connect(name, cfg).catch((e) => console.error(`MCP connect ${name} failed:`, e.message)),
      ),
    );
    await new Promise<void>((res, rej) => {
      this.http.once('error', rej);
      this.http.listen(this.config.port, this.config.host, () => {
        console.log(`LocalAI Code Editor server listening on ${this.config.host}:${this.config.port}`);
        res();
      });
    });
  }

  private handleHttp(req: IncomingMessage, res: ServerResponse): void {
    if (req.method === 'GET' && req.url) {
      this.serveStatic(req.url, res);
      return;
    }
    res.writeHead(404).end('Not found');
  }

  /** Serve the built web UI (and Monaco assets) when available. */
  private async serveStatic(url: string, res: ServerResponse): Promise<void> {
    const webDist = resolveWebDist();
    if (!webDist) {
      res.writeHead(404).end('Web UI not found. Set LOCALAI_WEB_DIST or run `pnpm --filter @localai/web build` first.');
      return;
    }
    let path = url === '/' ? '/index.html' : url;
    if (path.includes('..')) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const file = join(webDist, path);
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not file');
      const body = await readFile(file);
      const type = mime(extname(file));
      res.writeHead(200, { 'Content-Type': type }).end(body);
    } catch {
      res.writeHead(404).end('Web UI not built. Run `pnpm --filter @localai/web build` first.');
    }
  }

  private handleConnection(ws: WebSocket): void {
    // If the client disconnects mid-run, cancel its agent loop.
    ws.on('close', () => {
      this.runControllers.get(ws)?.abort();
      this.runControllers.delete(ws);
    });
    ws.on('message', async (data) => {
      let msg: { id?: number; method: string; params?: RpcParams };
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return this.sendError(ws, undefined, -32700, 'Parse error');
      }
      try {
        await this.dispatch(ws, msg);
      } catch (e) {
        this.sendError(ws, msg.id, -32000, e instanceof Error ? e.message : String(e));
      }
    });
  }

  private async dispatch(
    ws: WebSocket,
    msg: { id?: number; method: string; params?: RpcParams },
  ): Promise<void> {
    const { id, method, params = {} } = msg;
    switch (method) {
      // ---- Providers ----
      case 'providers.list': {
        this.sendResult(ws, id, {
          providers: this.providerRegistry.listConfigs(),
        });
        return;
      }
      case 'providers.health': {
        this.sendResult(ws, id, await this.providerRegistry.healthAll());
        return;
      }
      case 'providers.listModels': {
        const p = this.providerRegistry.get(String(params.providerId));
        if (!p) throw new Error(`Unknown provider: ${params.providerId}`);
        this.sendResult(ws, id, await p.listModels());
        return;
      }
      case 'providers.upsert': {
        const cfg = {
          id: String(params.id ?? '').trim(),
          label: String(params.label ?? '').trim() || String(params.id ?? '').trim(),
          baseUrl: String(params.baseUrl ?? '').trim().replace(/\/+$/, ''),
          apiKey: params.apiKey ? String(params.apiKey) : undefined,
        };
        if (!cfg.id) throw new Error('Provider id is required');
        if (!/^https?:\/\//.test(cfg.baseUrl)) throw new Error('Base URL must start with http:// or https://');
        this.providerRegistry.register(cfg);
        saveProviderOverrides(this.config.workspace, this.providerRegistry.listConfigs());
        this.sendResult(ws, id, { ok: true, providers: this.providerRegistry.listConfigs() });
        return;
      }
      case 'providers.remove': {
        const pid = String(params.id ?? '');
        if (!this.providerRegistry.unregister(pid)) throw new Error(`Unknown provider: ${pid}`);
        saveProviderOverrides(this.config.workspace, this.providerRegistry.listConfigs());
        this.sendResult(ws, id, { ok: true, providers: this.providerRegistry.listConfigs() });
        return;
      }
      case 'providers.test': {
        // Probe an endpoint without registering it (used by the Save/Test buttons).
        const probe = new OpenAICompatProvider({
          id: 'probe',
          label: 'probe',
          baseUrl: String(params.baseUrl ?? '').trim().replace(/\/+$/, ''),
          apiKey: params.apiKey ? String(params.apiKey) : undefined,
        });
        if (!/^https?:\/\//.test(probe.baseUrl)) throw new Error('Base URL must start with http:// or https://');
        this.sendResult(ws, id, await probe.health());
        return;
      }

      // ---- Agent / chat (streamed) ----
      case 'agent.run': {
        const provider = this.providerRegistry.get(String(params.providerId));
        if (!provider) throw new Error(`Unknown provider: ${params.providerId}`);
        const baseSystem = String(params.systemPrompt ?? defaultSystemPrompt(this.config.workspace));
        const system = await this.withWorkspacePrompt(this.buildSystemPrompt(baseSystem));
        const temperature = params.temperature != null ? Number(params.temperature) : undefined;
        const maxTokens = params.maxTokens != null ? Number(params.maxTokens) : undefined;
        if (temperature != null && (Number.isNaN(temperature) || temperature < 0 || temperature > 2)) {
          throw new Error('temperature must be between 0 and 2');
        }
        const controller = new AbortController();
        this.runControllers.set(ws, controller);
        const gen = runAgent({
          runtime: {
            workspace: this.config.workspace,
            fs: this.fs,
            getTools: () => {
              const tools = this.agentTools();
              return this.config.allowShell
                ? tools
                : tools.filter((t) => t.definition.name !== 'execute_command');
            },
          },
          provider,
          model: String(params.model),
          systemPrompt: system,
          userPrompt: String(params.prompt),
          temperature,
          maxTokens,
          signal: controller.signal,
          onEvent: (ev) => {
            ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'event', params: ev }));
          },
        });
        try {
          for await (const _ev of gen) {
            /* already forwarded via onEvent */
          }
          this.sendResult(ws, id, { ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (controller.signal.aborted || /abort/i.test(msg)) {
            ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'event', params: { type: 'done' } }));
            this.sendResult(ws, id, { ok: true, cancelled: true });
          } else {
            throw e;
          }
        } finally {
          this.runControllers.delete(ws);
        }
        return;
      }
      case 'agent.stop': {
        const c = this.runControllers.get(ws);
        if (!c) return this.sendResult(ws, id, { ok: false, error: 'No agent run in progress' });
        c.abort();
        return this.sendResult(ws, id, { ok: true });
      }
      case 'chat.send': {
        const provider = this.providerRegistry.get(String(params.providerId));
        if (!provider) throw new Error(`Unknown provider: ${params.providerId}`);
        const acc: string[] = [];
        for await (const chunk of provider.streamChat({
          model: String(params.model),
          messages: params.messages as ChatMessage[],
          tools: params.tools as unknown as Parameters<typeof provider.streamChat>[0]['tools'],
        })) {
          if (chunk.type === 'delta') {
            acc.push(chunk.content);
            ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'event', params: { type: 'delta', content: chunk.content } }));
          } else if (chunk.type === 'done') {
            ws.send(
              JSON.stringify({ jsonrpc: '2.0', method: 'event', params: { type: 'done', message: chunk.message } }),
            );
          }
        }
        this.sendResult(ws, id, { content: acc.join('') });
        return;
      }

      // ---- Git ----
      case 'git.status': return this.sendResult(ws, id, await this.git.status());
      case 'git.diff': return this.sendResult(ws, id, await this.git.diffFile(String(params.path), !!params.staged));
      case 'git.diffAll': return this.sendResult(ws, id, await this.git.diffAll(!!params.staged));
      case 'git.stage': { await this.git.stage((params.paths as string[]) ?? []); return this.sendResult(ws, id, { ok: true }); }
      case 'git.unstage': { await this.git.unstage((params.paths as string[]) ?? []); return this.sendResult(ws, id, { ok: true }); }
      case 'git.stageAll': { await this.git.stageAll(); return this.sendResult(ws, id, { ok: true }); }
      case 'git.commit': { await this.git.commit(String(params.message)); return this.sendResult(ws, id, { ok: true }); }
      case 'git.branches': return this.sendResult(ws, id, await this.git.branches());
      case 'git.createBranch': { await this.git.createBranch(String(params.name)); return this.sendResult(ws, id, { ok: true }); }
      case 'git.checkout': { await this.git.checkout(String(params.name)); return this.sendResult(ws, id, { ok: true }); }
      case 'git.deleteBranch': { await this.git.deleteBranch(String(params.name), !!params.force); return this.sendResult(ws, id, { ok: true }); }
      case 'git.push': return this.sendResult(ws, id, await this.git.push(String(params.remote ?? 'origin'), params.branch as string | undefined, {
        setUpstream: !!params.setUpstream,
        force: !!params.force,
      }));
      case 'git.pull': return this.sendResult(ws, id, await this.git.pull());
      case 'git.log': return this.sendResult(ws, id, await this.git.log(Number(params.limit ?? 50)));

      // ---- Skills ----
      case 'skills.list': return this.sendResult(ws, id, this.skills.list());
      case 'skills.read': {
        const s = this.skills.get(String(params.name));
        if (!s) throw new Error(`Unknown skill: ${params.name}`);
        return this.sendResult(ws, id, s);
      }
      case 'skills.setEnabled': {
        const ok = this.skills.setEnabled(String(params.name), !!params.enabled);
        if (!ok) throw new Error(`Unknown skill: ${params.name}`);
        return this.sendResult(ws, id, { ok: true });
      }

      // ---- Language servers ----
      case 'lsp.status': return this.sendResult(ws, id, this.lsp.status());
      case 'lsp.config': return this.sendResult(ws, id, this.config.languageServers);
      case 'lsp.restart': {
        await this.lsp.stop(String(params.id));
        return this.sendResult(ws, id, { ok: true });
      }

      // ---- MCP ----
      case 'mcp.connect': {
        await this.mcpHost.connect(String(params.name), params.config as McpServerConfig);
        return this.sendResult(ws, id, { ok: true });
      }
      case 'mcp.disconnect': { await this.mcpHost.disconnect(String(params.name)); return this.sendResult(ws, id, { ok: true }); }
      case 'mcp.status': return this.sendResult(ws, id, this.mcpHost.status());
      case 'mcp.listTools': return this.sendResult(ws, id, this.mcpHost.listTools());
      case 'mcp.callTool': return this.sendResult(ws, id, await this.mcpHost.callTool(String(params.name), (params.args ?? {}) as Record<string, unknown>));

      // ---- Filesystem (for the editor tree + agent file tools) ----
      case 'fs.list': return this.sendResult(ws, id, await this.fs.listFiles(String(params.path ?? '')));
      case 'fs.read': return this.sendResult(ws, id, await this.fs.readFile(String(params.path)));
      case 'fs.write': { await this.fs.writeFile(String(params.path), String(params.content)); return this.sendResult(ws, id, { ok: true }); }
      case 'fs.createFile': { await this.fs.createFile(String(params.path)); return this.sendResult(ws, id, { ok: true }); }
      case 'fs.createDir': { await this.fs.createDir(String(params.path)); return this.sendResult(ws, id, { ok: true }); }
      case 'fs.rename': { await this.fs.renamePath(String(params.path), String(params.newName)); return this.sendResult(ws, id, { ok: true }); }
      case 'fs.delete': { await this.fs.deletePath(String(params.path)); return this.sendResult(ws, id, { ok: true }); }
      case 'fs.allFiles': return this.sendResult(ws, id, await this.fs.allFiles());
      case 'fs.search': return this.sendResult(ws, id, await this.fs.searchText(String(params.query ?? '')));
      case 'fs.stat': {
        try {
          const info = await stat(resolve(this.config.workspace, String(params.path)));
          return this.sendResult(ws, id, { exists: true, isDir: info.isDirectory(), size: info.size });
        } catch {
          return this.sendResult(ws, id, { exists: false });
        }
      }

      // ---- Workspace ----
      case 'workspace.get':
        return this.sendResult(ws, id, { workspace: this.config.workspace });
      case 'workspace.set': {
        const result = await this.setWorkspace(String(params.path ?? ''));
        return this.sendResult(ws, id, result);
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private sendResult(ws: WebSocket, id: number | undefined, result: unknown): void {
    ws.send(JSON.stringify({ jsonrpc: '2.0', id, result }));
  }

  private sendError(ws: WebSocket, id: number | undefined, code: number, message: string): void {
    ws.send(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }));
  }

  /** Append <workspace>/.localai/system.md (if present) to the agent's system prompt. */
  private async withWorkspacePrompt(prompt: string): Promise<string> {
    try {
      const extra = await readFile(resolve(this.config.workspace, '.localai', 'system.md'), 'utf-8');
      const trimmed = extra.trim();
      if (!trimmed) return prompt;
      return `${prompt}\n\n# Workspace instructions\n\n${trimmed}`;
    } catch {
      return prompt;
    }
  }

  /** Switch the workspace at runtime: rebinds fs, git, skills, and LSP hosts. */
  private async setWorkspace(dir: string): Promise<{ ok: true; workspace: string }> {
    const target = resolve(dir.trim());
    if (!isAbsolute(target)) throw new Error('Workspace path must be absolute');
    const info = await stat(target).catch(() => null);
    if (!info || !info.isDirectory()) throw new Error(`Not a directory: ${target}`);

    await this.lsp.stopAll();
    this.config.workspace = target;
    this.git = new GitService(target);
    this.fs = new WorkspaceFs(target);
    this.skills = new SkillStore();
    void this.skills.load({
      projectDir: target,
      userDir: defaultUserSkillsDir(homedir()),
      builtinDir: builtinSkillsDir(),
    });
    this.lsp = new LanguageServerHost(target, this.config.languageServers);
    console.log(`Workspace switched to ${target}`);
    return { ok: true, workspace: target };
  }

  async stop(): Promise<void> {
    await this.mcpHost.disconnectAll();
    await this.lsp.stopAll();
    this.wss.close();
    await new Promise<void>((res) => this.http.close(() => res()));
  }
}

function mime(ext: string): string {
  const map: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return map[ext] ?? 'application/octet-stream';
}