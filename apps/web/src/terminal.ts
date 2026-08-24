/**
 * Terminal integration for running commands in an integrated terminal.
 * Uses WebSocket connection to the server for command execution.
 */

export interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'exit';
  content: string;
  exitCode?: number;
}

export class IntegratedTerminal {
  private ws: WebSocket | null = null;
  private output: TerminalOutput[] = [];

  constructor(private serverUrl: string = 'ws://127.0.0.1:4801') {}

  /**
   * Connect to the server terminal.
   */
  async connect(): Promise<void> {
    this.ws = new WebSocket(`${this.serverUrl}/terminal`);
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.output.push(data);
      } catch (e) {
        console.error('Failed to parse terminal output:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Terminal connection error:', error);
    };

    this.ws.onclose = () => {
      this.disconnect();
    };

    return new Promise((resolve, reject) => {
      this.ws!.onopen = () => resolve();
      this.ws!.onerror = () => reject(new Error('Failed to connect to terminal'));
    });
  }

  /**
   * Disconnect from the terminal.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Execute a command in the terminal.
   */
  async execute(command: TerminalCommand): Promise<TerminalOutput[]> {
    if (!this.ws) {
      throw new Error('Not connected to terminal');
    }

    const output: TerminalOutput[] = [];
    const processId = `process-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command execution timed out'));
      }, 30000); // 30 second timeout

      this.ws!.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.processId === processId) {
            output.push(data);
            if (data.type === 'exit') {
              clearTimeout(timeout);
              resolve(output);
            }
          }
        } catch (e) {
          console.error('Failed to parse terminal output:', e);
        }
      };

      this.ws!.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`Terminal command failed: ${error}`));
      };

      // Send command to server
      this.ws!.send(JSON.stringify({
        type: 'execute',
        processId,
        ...command,
      }));
    });
  }

  /**
   * Get all terminal output.
   */
  getOutput(): TerminalOutput[] {
    return [...this.output];
  }

  /**
   * Clear terminal output.
   */
  clearOutput(): void {
    this.output = [];
  }

  /**
   * Check if terminal is connected.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Global terminal instance.
 */
export const terminal = new IntegratedTerminal();