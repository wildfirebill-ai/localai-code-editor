import * as monaco from 'monaco-editor';
import { createMessageConnection, type MessageConnection } from 'vscode-jsonrpc';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import type {
  Hover,
  InitializeParams,
  InitializeResult,
  PublishDiagnosticsParams,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver-protocol';

export interface LspServerInfo {
  id: string;
  language: string;
  extensions: string[];
  label?: string;
}

interface OpenDocument {
  uri: string;
  language: string;
  version: number;
}

const VERSION = 1;
let versionCounter = 0;

function wsBase(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}`;
}

/** Convert a Monaco position to an LSP zero-based position. */
function toLspPosition(pos: monaco.Position): { line: number; character: number } {
  return { line: pos.lineNumber - 1, character: pos.column - 1 };
}

/** Map an LSP completion item to a Monaco completion item. */
function toMonacoCompletion(item: any): monaco.languages.CompletionItem {
  const label = typeof item.label === 'string' ? item.label : item.label?.label ?? '';
  return {
    label,
    kind: (item.kind ?? 0) as monaco.languages.CompletionItemKind,
    detail: item.detail,
    documentation: item.documentation as string | monaco.IMarkdownString | undefined,
    insertText: item.insertText ?? label,
    range: undefined as unknown as monaco.languages.CompletionItem['range'],
  };
}

/** Convert an LSP zero-based range to a Monaco range. */
function toMonacoRange(r: { start: { line: number; character: number }; end: { line: number; character: number } }): monaco.IRange {
  return new monaco.Range(r.start.line + 1, r.start.character + 1, r.end.line + 1, r.end.character + 1);
}

/** Convert an LSP Location (or LocationLink) to a Monaco Location. */
function toMonacoLocation(loc: any): monaco.languages.Location {
  const uri = loc.uri ?? loc.targetUri;
  const range = loc.range ?? loc.targetRange;
  return { uri: monaco.Uri.parse(uri), range: toMonacoRange(range) };
}

/**
 * A lightweight LSP client for one language server. It keeps a JSON-RPC
 * connection to the server's `/lsp/:id` endpoint and registers Monaco
 * providers for completion and hover, plus diagnostics markers.
 */
class LspClient {
  readonly id: string;
  readonly language: string;
  private connection: MessageConnection | null = null;
  /** URIs this client has opened (public so the module helpers can inspect). */
  readonly opened = new Map<string, OpenDocument>();

  constructor(readonly config: LspServerInfo) {
    this.id = config.id;
    this.language = config.language;
  }

  async start(): Promise<void> {
    const ws = new WebSocket(`${wsBase()}/lsp/${encodeURIComponent(this.id)}`);
    const socket = toSocket(ws);
    const connection = createMessageConnection(
      new WebSocketMessageReader(socket),
      new WebSocketMessageWriter(socket),
    );
    this.connection = connection;
    connection.listen();

    // Diagnostics are pushed by the server; write them to Monaco markers.
    connection.onNotification('textDocument/publishDiagnostics', (params: PublishDiagnosticsParams) => {
      this.applyDiagnostics(params.uri, params.diagnostics);
    });

    const init: InitializeParams = {
      processId: null,
      rootUri: null,
      capabilities: {
        textDocument: {
          completion: { completionItem: { snippetSupport: true, documentationFormat: ['markdown', 'plaintext'] } },
          hover: { contentFormat: ['markdown', 'plaintext'] },
          synchronization: { willSave: false, didSave: false },
        },
        workspace: { workspaceFolders: true },
      },
      workspaceFolders: null,
    };
    await connection.sendRequest<InitializeResult>('initialize', init);
    connection.sendNotification('initialized', {});

    // Monaco providers against the shared monaco instance.
    this.registerCompletion();
    this.registerHover();
    this.registerDefinition();
    this.registerReferences();
    this.registerRename();
  }

  async openFile(uri: string, text: string, language?: string): Promise<void> {
    const conn = this.connection;
    if (!conn) return;
    const lang = language ?? this.language;
    const doc: OpenDocument = { uri, language: lang, version: ++versionCounter };
    this.opened.set(uri, doc);
    conn.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId: lang, version: doc.version, text },
    });
  }

  async didChange(uri: string, text: string): Promise<void> {
    const conn = this.connection;
    const doc = this.opened.get(uri);
    if (!conn || !doc) return;
    doc.version += 1;
    const changes: TextDocumentContentChangeEvent[] = [{ text }];
    conn.sendNotification('textDocument/didChange', {
      textDocument: { uri, version: doc.version },
      contentChanges: changes,
    });
  }

  async closeFile(uri: string): Promise<void> {
    const conn = this.connection;
    if (!conn) return;
    this.opened.delete(uri);
    conn.sendNotification('textDocument/didClose', { textDocument: { uri } });
  }

  private applyDiagnostics(uri: string, diagnostics: PublishDiagnosticsParams['diagnostics']): void {
    const model = monaco.editor.getModel(monaco.Uri.parse(uri));
    if (!model) return;
    const markers = diagnostics.map((d) => ({
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      message: d.message,
      severity: severityToMonaco(d.severity),
      source: d.source,
    }));
    monaco.editor.setModelMarkers(model, this.id, markers);
  }

  private registerCompletion(): void {
    monaco.languages.registerCompletionItemProvider(this.language, {
      triggerCharacters: ['.', '(', '"', "'", '`', '#', '@'],
      provideCompletionItems: async (model, position) => {
        const conn = this.connection;
        if (!conn) return { suggestions: [] };
        const items = (await conn.sendRequest<any>('textDocument/completion', {
          textDocument: { uri: model.uri.toString() },
          position: toLspPosition(position),
          context: { triggerKind: 1 },
        })) ?? [];
        const list = Array.isArray(items) ? items : (items.items ?? []);
        return { suggestions: list.map(toMonacoCompletion) };
      },
    });
  }

  private registerHover(): void {
    monaco.languages.registerHoverProvider(this.language, {
      provideHover: async (model, position) => {
        const conn = this.connection;
        if (!conn) return { contents: [] };
        const hover = await conn.sendRequest<Hover | null>('textDocument/hover', {
          textDocument: { uri: model.uri.toString() },
          position: toLspPosition(position),
        });
        if (!hover) return { contents: [] };
        const contents = Array.isArray(hover.contents)
          ? hover.contents.map((c) => (typeof c === 'string' ? c : c.value))
          : typeof hover.contents === 'string'
            ? [hover.contents]
            : [hover.contents.value];
        return {
          contents: contents.map((v) => ({ value: v })),
          range: hover.range
            ? new monaco.Range(hover.range.start.line + 1, hover.range.start.character + 1, hover.range.end.line + 1, hover.range.end.character + 1)
            : undefined,
        };
      },
    });
  }

  /** Go-to-definition (F12 / Cmd+Click). */
  private registerDefinition(): void {
    monaco.languages.registerDefinitionProvider(this.language, {
      provideDefinition: async (model, position) => {
        const conn = this.connection;
        if (!conn) return [];
        const res = await conn.sendRequest<any>('textDocument/definition', {
          textDocument: { uri: model.uri.toString() },
          position: toLspPosition(position),
        });
        if (!res) return [];
        const list = Array.isArray(res) ? res : [res];
        const locations = list
          .map((l) => {
            const uri = l?.uri ?? l?.targetUri;
            const range = l?.range ?? l?.targetRange;
            if (!uri || !range) return null;
            return toMonacoLocation({ uri, range });
          })
          .filter((x): x is monaco.languages.Location => x !== null);
        return locations;
      },
    });
  }

  /** Find all references (Shift+F12). */
  private registerReferences(): void {
    monaco.languages.registerReferenceProvider(this.language, {
      provideReferences: async (model, position, _context) => {
        const conn = this.connection;
        if (!conn) return [];
        const res = await conn.sendRequest<any>('textDocument/references', {
          textDocument: { uri: model.uri.toString() },
          position: toLspPosition(position),
          context: { includeDeclaration: true },
        });
        if (!res) return [];
        return res.map(toMonacoLocation);
      },
    });
  }

  /** Rename symbol (F2). */
  private registerRename(): void {
    monaco.languages.registerRenameProvider(this.language, {
      provideRenameEdits: async (model, position, newName) => {
        const conn = this.connection;
        if (!conn) return { edits: [] };
        const res = await conn.sendRequest<any>('textDocument/rename', {
          textDocument: { uri: model.uri.toString() },
          position: toLspPosition(position),
          newName,
        });
        const changes = (res as { changes?: Record<string, Array<{ range: unknown; newText: string }>> } | null)?.changes;
        if (!changes) return { edits: [] };
        const edits: unknown[] = [];
        for (const uri of Object.keys(changes)) {
          for (const te of changes[uri]) {
            edits.push({
              resource: monaco.Uri.parse(uri),
              textEdit: { range: toMonacoRange(te.range as never), text: te.newText },
            });
          }
        }
        return { edits } as unknown as monaco.languages.WorkspaceEdit;
      },
    });
  }
}

function severityToMonaco(sev?: number): monaco.MarkerSeverity {
  switch (sev) {
    case 1: return monaco.MarkerSeverity.Error;
    case 2: return monaco.MarkerSeverity.Warning;
    case 3: return monaco.MarkerSeverity.Info;
    default: return monaco.MarkerSeverity.Hint;
  }
}

const clients = new Map<string, LspClient>();

/** Determine which LSP server (if any) handles a given file path. */
export function serverForFile(path: string): LspClient | undefined {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : '';
  for (const c of clients.values()) {
    if (c.config.extensions.includes(ext)) return c;
  }
  return undefined;
}

/** The LSP language id that should be used for a file, if any. */
export function languageForFile(path: string): string | undefined {
  return serverForFile(path)?.language;
}

/** Open a file in its language server (sends didOpen). */
export async function openInLanguageServer(path: string, uri: string, text: string): Promise<void> {
  const c = serverForFile(path);
  await c?.openFile(uri, text);
}

/** Notify the language server of an edit (sends didChange). */
export async function changedInLanguageServer(uri: string, text: string): Promise<void> {
  const conn = [...clients.values()];
  // find client that opened this uri
  for (const c of conn) {
    if (c.opened.has(uri)) await c.didChange(uri, text);
  }
}

/** Close a file in its language server (sends didClose). */
export async function closeInLanguageServer(uri: string): Promise<void> {
  for (const c of clients.values()) {
    if (c.opened.has(uri)) await c.closeFile(uri);
  }
}

/** Connect all configured language servers. Idempotent. */
export async function startLanguageServers(): Promise<void> {
  try {
    const ws = new WebSocket(`${wsBase()}/ws`);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WS connect failed'));
    });
    const call = <T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> =>
      new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1e9);
        const handler = (ev: MessageEvent) => {
          const msg = JSON.parse(ev.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result as T);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
      });

    const configs = await call<LspServerInfo[]>('lsp.config');
    for (const cfg of configs) {
      if (clients.has(cfg.id)) continue;
      const client = new LspClient(cfg);
      try {
        await client.start();
        clients.set(cfg.id, client);
        if (!monaco.languages.getLanguages().some((l) => l.id === cfg.language)) {
          monaco.languages.register({ id: cfg.language });
        }
        console.log(`[lsp] connected ${cfg.id} (${cfg.language})`);
      } catch (e) {
        console.error(`[lsp] ${cfg.id} failed to start:`, e instanceof Error ? e.message : e);
      }
    }
    ws.close();
  } catch (e) {
    console.error('[lsp] start failed:', e instanceof Error ? e.message : e);
  }
}

/** Expose opened-set membership for tests/UI. */
export function connectedLanguages(): string[] {
  return [...clients.values()].map((c) => c.language);
}

export { VERSION };
