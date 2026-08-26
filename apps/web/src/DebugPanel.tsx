import { useEffect, useState, useRef } from 'react';
import { useApp } from './state';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

interface ServerInfo {
  uptime: number;
  memoryMB: number;
  pid: number;
  nodeVersion: string;
  platform: string;
  arch: string;
}

const LEVEL_COLORS: Record<string, string> = {
  info: 'var(--fg-muted)',
  warn: 'var(--yellow, #e5c07b)',
  error: 'var(--red, #e06c75)',
  debug: '#58a6ff',
};

export function DebugPanel() {
  const { client } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [levelFilter, setLevelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      const result = await client.request<LogEntry[]>('debug.logs', {
        level: levelFilter || undefined,
        source: sourceFilter || undefined,
        limit: 200,
      });
      setLogs(result);
    } catch { /* ignore */ }
  };

  const loadInfo = async () => {
    try {
      const info = await client.request<ServerInfo>('debug.info');
      setServerInfo(info);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    void loadLogs();
    void loadInfo();
  }, [client, levelFilter, sourceFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => {
      void loadLogs();
      void loadInfo();
    }, 3000);
    return () => clearInterval(iv);
  }, [autoRefresh, levelFilter, sourceFilter]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-title">Debug Console</div>

      {/* Server Info */}
      {serverInfo && (
        <div style={{ padding: '0 10px 8px', display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
          <span><strong>PID:</strong> {serverInfo.pid}</span>
          <span><strong>Uptime:</strong> {Math.floor(serverInfo.uptime / 60)}m {serverInfo.uptime % 60}s</span>
          <span><strong>Memory:</strong> {serverInfo.memoryMB} MB</span>
          <span><strong>Node:</strong> {serverInfo.nodeVersion}</span>
          <span><strong>Platform:</strong> {serverInfo.platform} ({serverInfo.arch})</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: '0 10px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ fontSize: 11 }}>
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={{ fontSize: 11 }}>
          <option value="">All sources</option>
          <option value="startup">Startup</option>
          <option value="console">Console</option>
          <option value="mcp">MCP</option>
          <option value="agent">Agent</option>
          <option value="uncaught">Uncaught</option>
        </select>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh
        </label>
        <button className="btn tiny" onClick={loadLogs}>Refresh</button>
        <span className="muted" style={{ fontSize: 10, marginLeft: 'auto' }}>{logs.length} entries</span>
      </div>

      {/* Log Viewer */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-editor, #1e1e1e)',
          fontFamily: 'monospace',
          fontSize: 11,
          padding: '4px 10px',
          minHeight: 200,
          maxHeight: 400,
        }}
      >
        {logs.length === 0 && <p className="muted">No log entries</p>}
        {logs.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, lineHeight: '18px' }}>
            <span style={{ color: 'var(--fg-muted)', minWidth: 70, flexShrink: 0 }}>
              {formatTime(entry.timestamp)}
            </span>
            <span style={{ color: LEVEL_COLORS[entry.level] ?? 'inherit', minWidth: 45, flexShrink: 0, textTransform: 'uppercase', fontSize: 10 }}>
              {entry.level}
            </span>
            <span style={{ color: '#58a6ff', minWidth: 60, flexShrink: 0 }}>
              [{entry.source}]
            </span>
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
