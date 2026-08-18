import { useState } from 'react';
import { useApp } from './state';
import type { McpServerStatus } from './types';

type Form = {
  name: string;
  type: 'stdio' | 'http' | 'sse';
  command: string;
  args: string;
  url: string;
  env: string;
};

const EMPTY: Form = { name: '', type: 'stdio', command: '', args: '', url: '', env: '' };

export function SettingsPanel() {
  const { client, mcpStatus, mcpTools, lspStatus, refresh } = useApp();
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState('');

  const connect = async () => {
    setErr('');
    if (!form.name) return setErr('Name is required');
    try {
      const config =
        form.type === 'stdio'
          ? {
              type: 'stdio',
              command: form.command,
              args: form.args ? form.args.split(/\s+/).filter(Boolean) : undefined,
              env: parseEnv(form.env),
            }
          : { type: form.type, url: form.url };
      await client.request('mcp.connect', { name: form.name, config });
      setForm(EMPTY);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const disconnect = async (name: string) => {
    await client.request('mcp.disconnect', { name });
    await refresh();
  };

  return (
    <div className="settings-panel">
      <div className="panel-title">Language Servers</div>
      {lspStatus.length === 0 && <p className="muted" style={{ padding: '0 10px' }}>No language servers configured. Add them to <code>localai.config.json</code> under <code>languageServers</code>.</p>}
      <ul className="changes">
        {lspStatus.map((s) => (
          <li key={s.id} className="change">
            <span className={`dot ${s.running ? 'ok' : 'bad'}`} />
            <span className="change-path">{s.id} <span className="muted">({s.language})</span></span>
            <span className="muted">{s.running ? `pid ${s.pid}` : (s.error ?? 'stopped')}</span>
          </li>
        ))}
      </ul>

      <div className="panel-title">MCP Servers</div>
      <div className="mcp-status">
        {mcpStatus.length === 0 && <p className="muted">No MCP servers connected.</p>}
        {mcpStatus.map((s: McpServerStatus) => (
          <div key={s.name} className="mcp-item">
            <span className={`dot ${s.connected ? 'ok' : 'bad'}`} />
            <span className="change-path">{s.name}</span>
            <span className="muted">{s.transport} · {s.toolCount} tools</span>
            <button className="btn tiny" onClick={() => void disconnect(s.name)}>Disconnect</button>
          </div>
        ))}
      </div>

      <div className="panel-title">Connected Tools</div>
      <ul className="tools">
        {mcpTools.map((t) => (
          <li key={t.name} title={t.description ?? ''}>
            <code>{t.name}</code>
          </li>
        ))}
      </ul>

      <div className="panel-title">Add Server</div>
      <div className="form">
        <input placeholder="Name (e.g. filesystem)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Form['type'] })}>
          <option value="stdio">Local (stdio)</option>
          <option value="http">Remote (HTTP)</option>
          <option value="sse">Remote (SSE)</option>
        </select>
        {form.type === 'stdio' ? (
          <>
            <input placeholder="Command (e.g. npx)" value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} />
            <input placeholder="Args (space separated)" value={form.args} onChange={(e) => setForm({ ...form, args: e.target.value })} />
            <input placeholder="Env KEY=value, one per line" value={form.env} onChange={(e) => setForm({ ...form, env: e.target.value })} />
          </>
        ) : (
          <input placeholder="URL (e.g. http://localhost:9000/mcp)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        )}
        {err && <p className="error">{err}</p>}
        <button className="btn primary" onClick={connect}>Connect</button>
      </div>
    </div>
  );
}

function parseEnv(text: string): Record<string, string> | undefined {
  const env: Record<string, string> = {};
  let any = false;
  for (const line of text.split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      env[m[1].trim()] = m[2].trim();
      any = true;
    }
  }
  return any ? env : undefined;
}