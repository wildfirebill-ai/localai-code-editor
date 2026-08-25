import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { stat, mkdir, writeFile } from 'node:fs/promises';
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
import { startTask, recordMessage, finishTask, getTaskHistory, getTaskById } from './taskHistory.js';
import { SkillStore, defaultUserSkillsDir } from '@localai/skills';
import { WorkspaceFs } from './fs.js';
import { resolveWebDist } from './webdist.js';
import {
  applyLanguageServerOverrides,
  loadLanguageServerOverrides,
  saveLanguageServerOverrides,
  saveProviderOverrides,
} from './config.js';
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
  /** Pending tool-approval resolvers keyed by connection, then approval id. */
  private readonly pendingApprovals = new Map<WebSocket, Map<string, (approve: boolean) => void>>();

  /** Tool names whose execution mutates the workspace or runs commands. */
  private static readonly MUTATING_TOOLS = new Set(['execute_command', 'write_file']);

  /**
   * Wrap a tool so mutating calls pause until the user approves via the
   * `agent.approval` RPC. Read-only tools pass through untouched.
   */
  private guardTool(ws: WebSocket, tool: Tool): Tool {
    if (!EditorServer.MUTATING_TOOLS.has(tool.definition.name)) return tool;
    let seq = 0;
    return {
      definition: {
        ...tool.definition,
        description:
          tool.definition.description +
          ' [approval mode: each call pauses until the user approves it in the UI.]',
      },
      execute: async (args, ctx) => {
        const approvalId = `${Date.now()}-${++seq}`;
        const argsPreview = JSON.stringify(args).slice(0, 600);
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'event',
            params: { type: 'approval_request', id: approvalId, tool: tool.definition.name, args: argsPreview },
          }),
        );
        const approved = await new Promise<boolean>((resolve) => {
          let map = this.pendingApprovals.get(ws);
          if (!map) {
            map = new Map();
            this.pendingApprovals.set(ws, map);
          }
          map.set(approvalId, resolve);
        });
        if (!approved) {
          return {
            toolCallId: '',
            ok: false,
            content: 'DENIED by user. Do not retry the same action; ask how to proceed.',
          };
        }
        return tool.execute(args, ctx);
      },
    };
  }
  private readonly http: ReturnType<typeof createServer>;
  private readonly wss: WebSocketServer;

  constructor(readonly config: ServerConfig) {
    this.providerRegistry = new ProviderRegistry(config.providers);
    this.mcpHost = new McpHost();
    this.git = new GitService(config.workspace);
    this.fs = new WorkspaceFs(config.workspace);
    this.skills = new SkillStore();
    config.languageServers = applyLanguageServerOverrides(
      config.languageServers,
      loadLanguageServerOverrides(config.workspace),
    );
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
    // If the client disconnects mid-run, cancel its agent loop and deny pendings.
    ws.on('close', () => {
      this.runControllers.get(ws)?.abort();
      this.runControllers.delete(ws);
      for (const resolve of this.pendingApprovals.get(ws)?.values() ?? []) resolve(false);
      this.pendingApprovals.delete(ws);
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
        const requireApproval = !!params.requireApproval;
        startTask(String(params.prompt), String(params.providerId), String(params.model));
        const gen = runAgent({
          runtime: {
            workspace: this.config.workspace,
            fs: this.fs,
            getTools: () => {
              let tools = this.agentTools();
              if (!this.config.allowShell) {
                tools = tools.filter((t) => t.definition.name !== 'execute_command');
              }
              return requireApproval ? tools.map((t) => this.guardTool(ws, t)) : tools;
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
            // Record task history
            const eventType = ev.type as string;
            if (eventType === 'delta' && 'content' in ev) recordMessage('assistant', ev.content);
            else if (eventType === 'tool_call' && 'toolCall' in ev) recordMessage('assistant', ev.toolCall.name, { toolName: ev.toolCall.name });
            else if (eventType === 'tool_result' && 'result' in ev) recordMessage('tool', ev.result.content, { toolName: ev.result.content, success: ev.result.ok });
            else if (eventType === 'done') recordMessage('assistant', '(task complete)');
            else if (eventType === 'approval_request') recordMessage('assistant', `Approval request for ${(ev as any).tool}`, { toolName: (ev as any).tool });
          },
        });
        try {
          for await (const _ev of gen) {
            /* already forwarded via onEvent */
          }
          finishTask('completed');
          this.sendResult(ws, id, { ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (controller.signal.aborted || /abort/i.test(msg)) {
            finishTask('cancelled');
            ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'event', params: { type: 'done' } }));
            this.sendResult(ws, id, { ok: true, cancelled: true });
          } else {
            finishTask('failed');
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
      case 'agent.approval': {
        const approvalId = String(params.id ?? '');
        const pending = this.pendingApprovals.get(ws)?.get(approvalId);
        if (!pending) return this.sendResult(ws, id, { ok: false, error: `Unknown approval: ${approvalId}` });
        this.pendingApprovals.get(ws)!.delete(approvalId);
        pending(!!params.approve);
        return this.sendResult(ws, id, { ok: true });
      }
      case 'agent.history': {
        const history = getTaskHistory();
        return this.sendResult(ws, id, { tasks: history.map((t) => ({
          id: t.id,
          timestamp: t.timestamp,
          prompt: t.prompt,
          provider: t.provider,
          model: t.model,
          status: t.status,
          toolsCalled: t.toolsCalled,
          filesChanged: t.filesChanged,
          messageCount: t.messages.length,
        })) });
      }
      case 'agent.getTask': {
        const taskId = String(params.id ?? '');
        const task = getTaskById(taskId);
        if (!task) return this.sendResult(ws, id, { error: `Unknown task: ${taskId}` });
        return this.sendResult(ws, id, { task });
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
      case 'skills.install': {
        const skillName = String(params.name ?? '').trim();
        const skillContent = String(params.content ?? '');
        const skillCategory = String(params.category ?? 'other');
        const skillDescription = String(params.description ?? '');
        if (!skillName || !skillContent) throw new Error('name and content are required');
        const skillsDir = join(this.config.workspace, '.localai', 'skills', skillName);
        await mkdir(skillsDir, { recursive: true });
        const frontmatter = [
          '---',
          `name: ${skillName}`,
          `description: ${skillDescription}`,
          `category: ${skillCategory}`,
          '---',
          '',
        ].join('\n');
        await writeFile(join(skillsDir, 'SKILL.md'), frontmatter + skillContent, 'utf-8');
        await this.skills.load({
          projectDir: this.config.workspace,
          userDir: defaultUserSkillsDir(homedir()),
          builtinDir: builtinSkillsDir(),
        });
        return this.sendResult(ws, id, { ok: true });
      }
      case 'skills.uninstall': {
        const rmName = String(params.name ?? '').trim();
        if (!rmName) throw new Error('name is required');
        const { unlinkSync } = await import('node:fs');
        const skillDir = join(this.config.workspace, '.localai', 'skills', rmName);
        try { unlinkSync(join(skillDir, 'SKILL.md')); } catch { /* ignore */ }
        try { (await import('node:fs')).rmdirSync(skillDir); } catch { /* ignore */ }
        await this.skills.load({
          projectDir: this.config.workspace,
          userDir: defaultUserSkillsDir(homedir()),
          builtinDir: builtinSkillsDir(),
        });
        return this.sendResult(ws, id, { ok: true });
      }

      // ---- Language servers ----
      case 'lsp.status': return this.sendResult(ws, id, this.lsp.status());
      case 'lsp.config': return this.sendResult(ws, id, this.config.languageServers);
      case 'lsp.restart': {
        await this.lsp.stop(String(params.id));
        return this.sendResult(ws, id, { ok: true });
      }
      case 'lsp.upsert': {
        const cfg = {
          id: String(params.id ?? '').trim(),
          language: String(params.language ?? '').trim(),
          extensions: Array.isArray(params.extensions)
            ? params.extensions.map((e) => String(e).trim()).filter(Boolean)
            : String(params.extensions ?? '').split(/[,\s]+/).map((e) => e.trim()).filter(Boolean),
          command: String(params.command ?? '').trim(),
          args: Array.isArray(params.args) ? params.args.map(String) : [],
        };
        if (!cfg.id || !cfg.language || !cfg.command) {
          throw new Error('id, language and command are required');
        }
        const others = this.config.languageServers.filter((l) => l.id !== cfg.id);
        this.config.languageServers = [...others, cfg];
        saveLanguageServerOverrides(this.config.workspace, this.config.languageServers);
        await this.restartLspHosts();
        return this.sendResult(ws, id, { ok: true, languageServers: this.config.languageServers });
      }
      case 'lsp.remove': {
        const lid = String(params.id ?? '');
        const before = this.config.languageServers.length;
        this.config.languageServers = this.config.languageServers.filter((l) => l.id !== lid);
        if (this.config.languageServers.length === before) throw new Error(`Unknown language server: ${lid}`);
        saveLanguageServerOverrides(this.config.workspace, this.config.languageServers);
        await this.restartLspHosts();
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

      // ---- Sandbox ----
      case 'sandbox.status': {
        const result = await this.getSandboxStatus();
        return this.sendResult(ws, id, result);
      }
      case 'sandbox.start': {
        const result = await this.startSandbox(String(params.image ?? 'node:22-alpine'));
        return this.sendResult(ws, id, result);
      }
      case 'sandbox.stop': {
        const result = await this.stopSandbox();
        return this.sendResult(ws, id, result);
      }
      case 'sandbox.exec': {
        const result = await this.execInSandbox(String(params.command ?? ''));
        return this.sendResult(ws, id, result);
      }

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

  /** Recreate the LSP host so config changes take effect for newly opened files. */
  private async restartLspHosts(): Promise<void> {
    await this.lsp.stopAll();
    this.lsp = new LanguageServerHost(this.config.workspace, this.config.languageServers);
  }

  /** Switch the workspace at runtime: rebinds fs, git, skills, and LSP hosts. */
  private async setWorkspace(dir: string): Promise<{ ok: true; workspace: string }> {
    const target = resolve(dir.trim());
    if (!isAbsolute(target)) throw new Error('Workspace path must be absolute');
    const info = await stat(target).catch(() => null);
    if (!info || !info.isDirectory()) throw new Error(`Not a directory: ${target}`);

    await this.lsp.stopAll();
    this.config.workspace = target;
    this.config.languageServers = applyLanguageServerOverrides(
      this.config.languageServers,
      loadLanguageServerOverrides(target),
    );
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

  private sandboxContainerId: string | null = null;

  private async getSandboxStatus(): Promise<{ available: boolean; running: boolean; containerId?: string; image?: string; error?: string }> {
    try {
      const { execSync } = await import('node:child_process');
      execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    } catch {
      return { available: false, running: false, error: 'Docker is not available' };
    }
    if (this.sandboxContainerId) {
      try {
        const { execSync } = await import('node:child_process');
        const out = execSync(`docker inspect --format '{{.State.Running}}' ${this.sandboxContainerId}`, { encoding: 'utf-8', timeout: 5000 }).trim();
        if (out === 'true') {
          return { available: true, running: true, containerId: this.sandboxContainerId };
        }
      } catch { /* container gone */ }
      this.sandboxContainerId = null;
    }
    return { available: true, running: false };
  }

  private async startSandbox(image: string): Promise<{ ok: boolean; containerId?: string; error?: string }> {
    try {
      const { execSync } = await import('node:child_process');
      execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    } catch {
      return { ok: false, error: 'Docker is not available' };
    }
    try {
      const { execSync } = await import('node:child_process');
      const id = execSync(
        `docker run -d --rm --name localai-sandbox-${Date.now()} --network none ${image} sleep infinity`,
        { encoding: 'utf-8', timeout: 30000 },
      ).trim();
      this.sandboxContainerId = id;
      return { ok: true, containerId: id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  private async stopSandbox(): Promise<{ ok: boolean; error?: string }> {
    if (!this.sandboxContainerId) return { ok: true };
    try {
      const { execSync } = await import('node:child_process');
      execSync(`docker stop ${this.sandboxContainerId}`, { timeout: 10000 });
      this.sandboxContainerId = null;
      return { ok: true };
    } catch (e) {
      this.sandboxContainerId = null;
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  private async execInSandbox(command: string): Promise<{ ok: boolean; stdout: string; stderr: string; exitCode: number }> {
    if (!this.sandboxContainerId) return { ok: false, stdout: '', stderr: 'Sandbox is not running', exitCode: 1 };
    try {
      const { execSync } = await import('node:child_process');
      const stdout = execSync(`docker exec ${this.sandboxContainerId} sh -c ${JSON.stringify(command)}`, {
        encoding: 'utf-8',
        timeout: 60000,
      });
      return { ok: true, stdout, stderr: '', exitCode: 0 };
    } catch (e: any) {
      return { ok: false, stdout: e.stdout ?? '', stderr: e.stderr ?? e.message, exitCode: e.status ?? 1 };
    }
  }

  async stop(): Promise<void> {
    if (this.sandboxContainerId) {
      try { await this.stopSandbox(); } catch { /* ignore */ }
    }
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