/**
 * Ring-buffer logger for the editor server.
 * Captures console output, uncaught errors, and startup events.
 * Exposed via the debug.* RPC endpoints.
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

const MAX_ENTRIES = 500;
const entries: LogEntry[] = [];

function add(level: LogEntry['level'], source: string, message: string): void {
  entries.push({
    timestamp: new Date().toISOString(),
    level,
    source,
    message: message.slice(0, 1000),
  });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

/** Override console methods to capture output. */
export function installConsoleCapture(): void {
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: unknown[]) => {
    add('info', 'console', args.map(String).join(' '));
    origLog.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    add('warn', 'console', args.map(String).join(' '));
    origWarn.apply(console, args);
  };
  console.error = (...args: unknown[]) => {
    add('error', 'console', args.map(String).join(' '));
    origError.apply(console, args);
  };

  // Capture uncaught exceptions
  process.on('uncaughtException', (err) => {
    add('error', 'uncaught', `${err.message}\n${err.stack ?? ''}`);
  });
  process.on('unhandledRejection', (reason) => {
    add('error', 'unhandled', String(reason));
  });
}

/** Log startup event. */
export function logStartup(message: string): void {
  add('info', 'startup', message);
}

/** Log MCP events. */
export function logMcp(message: string): void {
  add('info', 'mcp', message);
}

/** Log agent events. */
export function logAgent(message: string): void {
  add('info', 'agent', message);
}

/** Log errors. */
export function logError(source: string, message: string): void {
  add('error', source, message);
}

/** Get recent log entries. */
export function getLogs(opts?: { level?: string; source?: string; limit?: number }): LogEntry[] {
  let filtered = entries;
  if (opts?.level) filtered = filtered.filter((e) => e.level === opts.level);
  if (opts?.source) filtered = filtered.filter((e) => e.source === opts.source);
  const limit = opts?.limit ?? 100;
  return filtered.slice(-limit);
}

/** Get connection status info. */
export function getConnectionInfo(): Record<string, unknown> {
  return {
    uptime: Math.floor(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}
