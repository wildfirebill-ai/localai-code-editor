import { useState } from 'react';
import { MCP_SERVER_REGISTRY, MCP_CATEGORIES, type McpServerRegistryEntry } from './mcp-registry';
import type { McpServerStatus } from './types';

type McpForm = {
  name: string;
  type: 'stdio' | 'http' | 'sse';
  command: string;
  args: string;
  url: string;
  env: string;
};

const EMPTY_MCP: McpForm = { name: '', type: 'stdio', command: '', args: '', url: '', env: '' };

interface McpDiscoverProps {
  mcpStatus: McpServerStatus[];
  client: { request: <T>(m: string, p?: Record<string, unknown>) => Promise<T> };
  refresh: () => Promise<void>;
}

export function McpDiscover({ mcpStatus, client, refresh }: McpDiscoverProps) {
  const [tab, setTab] = useState<'added' | 'discover'>('added');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [form, setForm] = useState<McpForm>(EMPTY_MCP);
  const [err, setErr] = useState('');

  const filteredServers = MCP_SERVER_REGISTRY.filter((s) => {
    if (category !== 'all' && s.category !== category) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const installedIds = new Set(mcpStatus.map((s) => s.name));

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
      setForm(EMPTY_MCP);
      setTab('added');
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const installServer = async (server: McpServerRegistryEntry) => {
    try {
      const config: McpForm = {
        name: server.id,
        type: server.stdio ? 'stdio' : server.http ? 'http' : server.sse ? 'sse' : 'stdio',
        command: server.stdio?.command || '',
        args: server.stdio?.args?.join(' ') || '',
        url: server.http?.url || server.sse?.url || '',
        env: server.stdio?.env ? Object.entries(server.stdio.env).map(([k, v]) => `${k}=${v}`).join('\n') : '',
      };
      await client.request('mcp.connect', { name: server.id, config });
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="mcp-discover">
      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 8, padding: '0 10px 8px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <button className={`btn ${tab === 'added' ? 'primary' : 'subtle'}`} onClick={() => setTab('added')}>
          Installed ({mcpStatus.length})
        </button>
        <button className={`btn ${tab === 'discover' ? 'primary' : 'subtle'}`} onClick={() => setTab('discover')}>
          Discover ({MCP_SERVER_REGISTRY.length})
        </button>
      </div>

      {tab === 'added' ? (
        <div className="mcp-status">
          {mcpStatus.length === 0 && <p className="muted" style={{ padding: '0 10px' }}>No MCP servers connected.</p>}
          <ul className="changes">
            {mcpStatus.map((s: McpServerStatus) => (
              <li key={s.name} className="mcp-item">
                <span className={`dot ${s.connected ? 'ok' : 'bad'}`} />
                <span className="change-path">{s.name}</span>
                <span className="muted">{s.transport} · {s.toolCount} tools</span>
                <button className="btn tiny" onClick={async () => {
                  try { await client.request('mcp.disconnect', { name: s.name }); } catch {}
                  await refresh();
                }}>Disconnect</button>
              </li>
            ))}
          </ul>

          {/* Quick Add Form */}
          <div className="panel-title" style={{ marginTop: 8 }}>Add Server</div>
          <div className="form">
            <input placeholder="Name (e.g. filesystem)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as McpForm['type'] })}>
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
      ) : (
        /* Discover view */
        <div>
          <div style={{ padding: '0 10px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Search MCP servers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 140 }}>
              <option value="all">All Categories</option>
              {MCP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div style={{ padding: '0 10px', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredServers.map((server) => {
              const installed = installedIds.has(server.id);
              return (
                <div key={server.id} className="mcp-discover-card" style={{
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 12,
                  background: installed ? 'rgba(255, 200, 0, 0.1)' : 'var(--bg-panel)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{server.name}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{server.category}</div>
                    </div>
                    <span className={installed ? 'dot ok' : 'dot'} title={installed ? 'Installed' : 'Not installed'} />
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{server.description}</div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--fg-muted)', flexWrap: 'wrap' }}>
                    {server.tags?.slice(0, 4).map((t) => (
                      <span key={t} style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {installed ? (
                      <button className="btn tiny" onClick={async () => {
                        try { await client.request('mcp.disconnect', { name: server.id }); } catch {}
                        await refresh();
                      }}>Remove</button>
                    ) : (
                      <button className="btn primary" onClick={() => void installServer(server)}>Install</button>
                    )}
                    {server.homepage && (
                      <a href={server.homepage} target="_blank" rel="noopener noreferrer" className="btn tiny" style={{ background: 'transparent', color: 'var(--fg-muted)' }}>Docs</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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