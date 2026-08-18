import { spawn, type ChildProcess } from 'node:child_process';
import { createMessageConnection, type MessageConnection, type Message } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node.js';
import type { WebSocket } from 'ws';
import { WebSocketMessageReader, WebSocketMessageWriter } from './ws-transport.js';
import type { LanguageServerConfig, LanguageServerStatus } from './types.js';

interface ManagedServer {
  config: LanguageServerConfig;
  process?: ChildProcess;
  connection?: MessageConnection;
  error?: string;
}

/**
 * Hosts one or more LSP language-server processes. Each server is spawned via
 * stdio and speaks JSON-RPC. A browser WebSocket connection to the server is
 * bridged to the process by forwarding messages in both directions, so Monaco
 * can talk LSP without any native code in the browser.
 */
export class LanguageServerHost {
  private servers = new Map<string, ManagedServer>();

  constructor(private readonly workspace: string, configs: LanguageServerConfig[] = []) {
    for (const cfg of configs) this.servers.set(cfg.id, { config: cfg });
  }

  register(config: LanguageServerConfig): void {
    this.servers.set(config.id, { config });
  }

  private async ensureConnection(id: string): Promise<MessageConnection> {
    const server = this.servers.get(id);
    if (!server) throw new Error(`Unknown language server: ${id}`);
    if (server.connection) return server.connection;
    if (server.process && server.process.exitCode === null && server.connection) return server.connection;

    const child = spawn(server.config.command, server.config.args ?? [], {
      cwd: server.config.cwd ?? this.workspace,
      env: { ...process.env, ...server.config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    server.process = child;

    const connection = createMessageConnection(
      new StreamMessageReader(child.stdout),
      new StreamMessageWriter(child.stdin),
    );
    child.on('error', (err) => {
      server.error = err.message;
    });
    child.on('exit', (code) => {
      server.error = `exited with code ${code}`;
      server.connection = undefined;
      server.process = undefined;
    });
    server.connection = connection;
    server.error = undefined;

    connection.listen();
    return connection;
  }

  /**
   * Bridge an incoming browser WebSocket to a language server process.
   * Messages flow both ways between the socket and the spawned process.
   */
  async attach(socket: WebSocket, id: string): Promise<void> {
    const serverConnection = await this.ensureConnection(id);
    const webSocketConnection = createMessageConnection(
      new WebSocketMessageReader(socket),
      new WebSocketMessageWriter(socket),
    );
    webSocketConnection.listen();

    // Forward browser -> server and server -> browser.
    serverConnection.onNotification((method, params) => {
      webSocketConnection.sendNotification(method, params as Message);
    });
    webSocketConnection.onNotification((method, params) => {
      serverConnection.sendNotification(method, params as Message);
    });
    serverConnection.onRequest(async (method, params, token) => {
      return await webSocketConnection.sendRequest(method, params as never, token);
    });
    webSocketConnection.onRequest(async (method, params, token) => {
      return await serverConnection.sendRequest(method, params as never, token);
    });
  }

  status(): LanguageServerStatus[] {
    return [...this.servers.values()].map((s) => ({
      id: s.config.id,
      language: s.config.language,
      extensions: s.config.extensions,
      running: !!s.connection && !!s.process,
      pid: s.process?.pid,
      error: s.error,
    }));
  }

  async stop(id?: string): Promise<void> {
    const targets = id ? [id] : [...this.servers.keys()];
    for (const t of targets) {
      const s = this.servers.get(t);
      if (s?.process) {
        try {
          s.process.kill('SIGTERM');
        } catch {
          /* ignore */
        }
        s.process = undefined;
        s.connection = undefined;
      }
    }
  }

  async stopAll(): Promise<void> {
    await this.stop();
  }
}