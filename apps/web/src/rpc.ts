/**
 * Typed WebSocket JSON-RPC client for the LocalAI Code Editor server.
 */
export type Listener = (params: unknown) => void;

interface Pending {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
}

let nextId = 1;

export class RpcClient {
  private ws?: WebSocket;
  private readonly pending = new Map<number, Pending>();
  private readonly listeners = new Set<Listener>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly url = () => `${wsBase()}/ws`) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url());
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      ws.onmessage = (ev) => this.onMessage(ev.data);
      ws.onclose = () => {
        for (const [, p] of this.pending) p.reject(new Error('Connection closed'));
        this.pending.clear();
        // Auto-reconnect (e.g. server restarted).
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect().catch(() => {});
        }, 2000);
      };
    });
  }

  onEvent(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  private onMessage(data: unknown): void {
    let msg: { jsonrpc?: string; id?: number; method?: string; params?: unknown; result?: unknown; error?: { code: number; message: string } };
    try {
      msg = JSON.parse(String(data));
    } catch {
      return;
    }
    if (msg.method === 'event') {
      for (const l of this.listeners) l(msg.params);
      return;
    }
    if (msg.id !== undefined) {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    }
  }
}

function wsBase(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}`;
}