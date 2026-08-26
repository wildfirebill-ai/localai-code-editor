import {
  Client,
  type ClientOptions,
} from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpCallResult, McpServerConfig, McpServerStatus, McpTool } from './types.js';

interface ManagedServer {
  name: string;
  config: McpServerConfig;
  client: Client;
  transport: import('@modelcontextprotocol/sdk/shared/transport.js').Transport;
  tools: Map<string, McpTool>;
  disconnectedAt?: number;
  reconnectAttempts: number;
  logs: string[];
}

/**
 * Hosts connections to zero or more MCP servers. Each server is either a
 * local subprocess (stdio) or a remote HTTP/SSE endpoint. Tools discovered
 * from all servers are exposed to the agent loop under a namespaced key.
 */
export class McpHost {
  private servers = new Map<string, ManagedServer>();
  private readonly onStatusChange?: (status: McpServerStatus[]) => void;

  constructor(opts?: { onStatusChange?: (status: McpServerStatus[]) => void }) {
    this.onStatusChange = opts?.onStatusChange;
  }

  /** Connect (or reconnect) a server from its config. */
  async connect(name: string, config: McpServerConfig): Promise<void> {
    await this.disconnect(name);

    const clientOptions: ClientOptions = {};

    let transport: import('@modelcontextprotocol/sdk/shared/transport.js').Transport;
    if (config.type === 'stdio') {
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
        cwd: config.cwd,
      });
    } else if (config.type === 'http') {
      transport = new StreamableHTTPClientTransport(new URL(config.url), {
        requestInit: config.headers ? { headers: config.headers } : undefined,
      });
    } else {
      // sse
      const sseTransport = new SSEClientTransport(new URL(config.url), {
        requestInit: config.headers ? { headers: config.headers } : undefined,
      });
      transport = sseTransport;
    }

    const client = new Client({ name: 'localai-code-editor', version: '0.1.0' }, clientOptions);
    await client.connect(transport);

    const toolsResult = await client.listTools();
    const tools = new Map<string, McpTool>();
    for (const tool of toolsResult.tools) {
      tools.set(tool.name, {
        name: `${name}::${tool.name}`,
        rawName: tool.name,
        server: name,
        description: tool.description,
        inputSchema: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object' },
      });
    }

    this.servers.set(name, { name, config, client, transport, tools, reconnectAttempts: 0, logs: [`Connected at ${new Date().toISOString()}`] });
    this.emitStatus();
  }

  async disconnect(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      try {
        await server.client.close();
      } catch {
        /* ignore close errors */
      }
      this.servers.delete(name);
      this.emitStatus();
    }
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this.servers.keys()].map((n) => this.disconnect(n)));
  }

  /** All tools across all connected servers, namespaced. */
  listTools(): McpTool[] {
    return [...this.servers.values()].flatMap((s) => [...s.tools.values()]);
  }

  /** Invoke a tool by its namespaced name (`server::tool`). */
  async callTool(fullName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    const [serverName, ...rest] = fullName.split('::');
    const toolName = rest.join('::');
    const server = this.servers.get(serverName);
    if (!server) return { ok: false, content: null, error: `No connected server named '${serverName}'` };
    try {
      const result = (await server.client.callTool({ name: toolName, arguments: args })) as CallToolResult;
      return {
        ok: !result.isError,
        content: result.content,
        isError: result.isError === true,
      };
    } catch (e) {
      return { ok: false, content: null, error: e instanceof Error ? e.message : String(e) };
    }
  }

  status(): McpServerStatus[] {
    return [...this.servers.values()].map((s) => ({
      name: s.name,
      transport: s.config.type,
      connected: true,
      toolCount: s.tools.size,
    }));
  }

  // ---- Auto-reconnect ----

  async autoReconnect(): Promise<void> {
    const disconnected = [...this.servers.entries()].filter(([, s]) => s.disconnectedAt);
    for (const [name, server] of disconnected) {
      const delay = Math.min(1000 * Math.pow(2, server.reconnectAttempts), 30000);
      server.reconnectAttempts++;
      server.logs.push(`Reconnect attempt ${server.reconnectAttempts} in ${delay}ms`);
      setTimeout(async () => {
        try {
          await this.connect(name, server.config);
          server.logs.push(`Reconnected successfully`);
        } catch (e) {
          server.logs.push(`Reconnect failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }, delay);
    }
  }

  // ---- Health check ----

  async healthCheck(): Promise<{ name: string; healthy: boolean; error?: string }[]> {
    const results: { name: string; healthy: boolean; error?: string }[] = [];
    for (const [name, server] of this.servers) {
      try {
        await server.client.listTools();
        results.push({ name, healthy: true });
      } catch (e) {
        server.disconnectedAt = Date.now();
        results.push({ name, healthy: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return results;
  }

  // ---- Tool call retry ----

  async callToolWithRetry(fullName: string, args: Record<string, unknown>, retries = 2): Promise<McpCallResult> {
    let lastError: McpCallResult | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await this.callTool(fullName, args);
      if (result.ok) return result;
      lastError = result;
      if (attempt < retries) {
        const delay = Math.min(500 * Math.pow(2, attempt), 5000);
        await new Promise((r) => setTimeout(r, delay));
        // Try reconnecting the server
        const [serverName] = fullName.split('::');
        const server = this.servers.get(serverName);
        if (server?.disconnectedAt) {
          try { await this.connect(serverName, server.config); } catch { /* ignore */ }
        }
      }
    }
    return lastError!;
  }

  // ---- Server logs ----

  getServerLogs(name: string): string[] {
    return this.servers.get(name)?.logs ?? [];
  }

  getAllLogs(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [name, server] of this.servers) {
      out[name] = server.logs;
    }
    return out;
  }

  // ---- Config import/export ----

  exportConfigs(): Record<string, McpServerConfig> {
    const out: Record<string, McpServerConfig> = {};
    for (const [name, server] of this.servers) {
      out[name] = server.config;
    }
    return out;
  }

  private emitStatus(): void {
    this.onStatusChange?.(this.status());
  }
}