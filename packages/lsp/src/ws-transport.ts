import {
  MessageReader,
  MessageWriter,
  type Message,
  type DataCallback,
  Disposable,
  Emitter,
} from 'vscode-jsonrpc';
import type { WebSocket } from 'ws';

/**
 * A MessageReader that reads JSON-RPC messages from a `ws` (Node) WebSocket.
 * The `ws` socket uses the EventEmitter API, unlike the browser WebSocket.
 */
export class WebSocketMessageReader implements MessageReader {
  private readonly errorEmitter = new Emitter<Error>();
  private readonly closeEmitter = new Emitter<void>();
  private callback: DataCallback | undefined;

  constructor(socket: WebSocket) {
    socket.on('message', (data) => {
      if (!this.callback) return;
      try {
        this.callback(JSON.parse(data.toString()));
      } catch {
        /* ignore malformed frames */
      }
    });
    socket.on('error', (err) => this.errorEmitter.fire(err instanceof Error ? err : new Error(String(err))));
    socket.on('close', () => this.closeEmitter.fire());
  }

  listen(callback: DataCallback): Disposable {
    this.callback = callback;
    return Disposable.create(() => {
      this.callback = undefined;
    });
  }

  onError(listener: (error: Error) => void): Disposable {
    return this.errorEmitter.event(listener);
  }
  onClose(listener: () => void): Disposable {
    return this.closeEmitter.event(listener);
  }
  onPartialMessage(): Disposable {
    // We always receive complete messages over WebSocket; no partials.
    return Disposable.create(() => {});
  }

  dispose(): void {
    this.callback = undefined;
  }
}

/** A MessageWriter that writes JSON-RPC messages to a `ws` (Node) WebSocket. */
export class WebSocketMessageWriter implements MessageWriter {
  private readonly errorEmitter = new Emitter<[Error, Message | undefined, number | undefined]>();
  private readonly closeEmitter = new Emitter<void>();
  private readonly socket: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
    socket.on('error', (err) => this.errorEmitter.fire([err instanceof Error ? err : new Error(String(err)), undefined, -1]));
    socket.on('close', () => this.closeEmitter.fire());
  }

  write(msg: Message): Promise<void> {
    this.socket.send(JSON.stringify(msg));
    return Promise.resolve();
  }

  end(): void {
    // socket close is owned by the host; nothing to do here
  }

  onError(listener: (e: [Error, Message | undefined, number | undefined]) => void): Disposable {
    return this.errorEmitter.event(listener);
  }
  onClose(listener: () => void): Disposable {
    return this.closeEmitter.event(listener);
  }

  dispose(): void {
    // no-op; the socket lifecycle is owned by the caller
  }
}