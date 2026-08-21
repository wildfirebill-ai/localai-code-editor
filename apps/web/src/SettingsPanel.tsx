import { useState } from 'react';
import { useApp } from './state';
import type { McpServerStatus, ProviderInfo } from './types';

type McpForm = {
  name: string;
  type: 'stdio' | 'http' | 'sse';
  command: string;
  args: string;
  url: string;
  env: string;
};

const EMPTY_MCP: McpForm = { name: '', type: 'stdio', command: '', args: '', url: '', env: '' };

type ProvForm = {
  id: string;
  label: string;
  baseUrl: string;
  apiKey: string;
};

/** Well-known presets mirrored from @localai/provider (kept in sync manually). */
const PRESETS: { id: string; label: string; defaultBaseUrl: string; hint: string }[] = [
  { id: 'ollama', label: 'Ollama', defaultBaseUrl: 'http://localhost:11434/v1', hint: 'Ollama OpenAI-compatible API (/v1).' },
  { id: 'lmstudio', label: 'LM Studio', defaultBaseUrl: 'http://localhost:1234/v1', hint: 'Enable the local server in LM Studio.' },
  { id: 'llamacpp', label: 'llama.cpp server', defaultBaseUrl: 'http://localhost:8080/v1', hint: 'Run `llama-server -m model.gguf`.' },
  { id: 'vllm', label: 'vLLM', defaultBaseUrl: 'http://localhost:8000/v1', hint: 'vLLM OpenAI-compatible server.' },
];

const EMPTY_PROV: ProvForm = { id: '', label: '', baseUrl: '', apiKey: '' };

export function SettingsPanel() {
  const { client, workspace, setWorkspace, providers, providerHealth, mcpStatus, mcpTools, lspStatus, refresh } = useApp();
  const [form, setForm] = useState<McpForm>(EMPTY_MCP);
  const [err, setErr] = useState('');
  const [wsInput, setWsInput] = useState('');
  const [wsErr, setWsErr] = useState('');

  const [provForm, setProvForm] = useState<ProvForm>(EMPTY_PROV);
  const [provEditing, setProvEditing] = useState<string | null>(null);
  const [provErr, setProvErr] = useState('');
  const [provMsg, setProvMsg] = useState('');

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
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const disconnect = async (name: string) => {
    await client.request('mcp.disconnect', { name });
    await refresh();
  };

  // ---- Providers ----

  const startEditProv = (p: ProviderInfo) => {
    setProvEditing(p.id);
    setProvErr('');
    setProvMsg('');
    setProvForm({ id: p.id, label: p.label, baseUrl: p.baseUrl, apiKey: p.apiKey ?? '' });
  };

  const startAddProv = () => {
    setProvEditing('__new__');
    setProvErr('');
    setProvMsg('');
    setProvForm(EMPTY_PROV);
  };

  const cancelProv = () => {
    setProvEditing(null);
    setProvErr('');
    setProvMsg('');
  };

  const testProv = async () => {
    setProvErr('');
    setProvMsg('');
    try {
      const res = await client.request<{ ok: boolean; latencyMs?: number; error?: string }>('providers.test', {
        baseUrl: provForm.baseUrl,
        apiKey: provForm.apiKey || undefined,
      });
      if (res.ok) setProvMsg(`Connected (${res.latencyMs ?? '?'} ms)`);
      else setProvErr(res.error ?? 'Unreachable');
    } catch (e) {
      setProvErr(e instanceof Error ? e.message : String(e));
    }
  };

  const saveProv = async () => {
    setProvErr('');
    setProvMsg('');
    try {
      await client.request('providers.upsert', {
        id: provForm.id.trim(),
        label: provForm.label.trim() || provForm.id.trim(),
        baseUrl: provForm.baseUrl.trim(),
        apiKey: provForm.apiKey.trim() || undefined,
      });
      cancelProv();
      await refresh();
    } catch (e) {
      setProvErr(e instanceof Error ? e.message : String(e));
    }
  };

  const removeProv = async (id: string) => {
    try {
      await client.request('providers.remove', { id });
      if (provEditing === id) cancelProv();
      await refresh();
    } catch (e) {
      setProvErr(e instanceof Error ? e.message : String(e));
    }
  };

  // ---- Workspace ----

  const pickFolder = async () => {
    setWsErr('');
    const picked = await window.localai?.pickWorkspace();
    if (!picked || picked === workspace) return;
    try {
      await setWorkspace(picked);
    } catch (e) {
      setWsErr(e instanceof Error ? e.message : String(e));
    }
  };

  const setWsManually = async () => {
    setWsErr('');
    if (!wsInput.trim()) return;
    try {
      await setWorkspace(wsInput.trim());
      setWsInput('');
    } catch (e) {
      setWsErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-title">Workspace</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 6px', wordBreak: 'break-all' }}>{workspace || '…'}</p>
      <div className="form" style={{ paddingBottom: 8 }}>
        {window.localai && (
          <button className="btn primary" onClick={pickFolder}>Open Folder…</button>
        )}
        <input
          placeholder="Or type an absolute path…"
          value={wsInput}
          onChange={(e) => setWsInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void setWsManually()}
        />
        <button className="btn tiny" onClick={setWsManually}>Set</button>
        {wsErr && <p className="error">{wsErr}</p>}
      </div>

      <div className="panel-title">LLM Providers</div>
      <div className="mcp-status">
        <ul className="changes">
          {providers.map((p) => {
            const h = providerHealth[p.id];
            return (
              <li key={p.id} className="change" title={p.baseUrl}>
                <span className={`dot ${h?.ok ? 'ok' : 'bad'}`} />
                <span className="change-path">{p.label}</span>
                <span className="muted">{h?.ok ? `${h.latencyMs ?? '?'} ms` : (h?.error ?? p.baseUrl)}</span>
                <button className="btn tiny" title="Edit connection settings" onClick={() => startEditProv(p)}>
                  Edit
                </button>
                <button className="btn tiny" onClick={() => void removeProv(p.id)}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
        {provEditing !== '__new__' && (
          <button className="btn tiny" onClick={startAddProv}>
            + Add provider
          </button>
        )}
      </div>

      {provEditing && (
        <ProviderForm
          form={provForm}
          setForm={setProvForm}
          err={provErr}
          msg={provMsg}
          isNew={provEditing === '__new__'}
          onTest={testProv}
          onSave={saveProv}
          onCancel={cancelProv}
        />
      )}

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
  );
}

type FormProps = {
  form: ProvForm;
  setForm: (f: ProvForm) => void;
  err: string;
  msg: string;
  isNew: boolean;
  onTest: () => void;
  onSave: () => void;
  onCancel: () => void;
};

function ProviderForm({ form, setForm, err, msg, isNew, onTest, onSave, onCancel }: FormProps) {
  const presetMatch = PRESETS.find((p) => p.id === form.id);
  return (
    <div className="form" style={{ marginTop: 8 }}>
      {isNew && (
        <>
          <select
            value=""
            onChange={(e) => {
              const preset = PRESETS.find((p) => p.id === e.target.value);
              if (preset) {
                setForm({
                  id: preset.id,
                  label: preset.label,
                  baseUrl: preset.defaultBaseUrl,
                  apiKey: '',
                });
              } else {
                setForm({ ...form, id: '' });
              }
            }}
          >
            <option value="">Choose a preset…</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
            <option value="__custom__">Custom…</option>
          </select>
          <input placeholder="Id (e.g. ollama, my-vllm)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        </>
      )}
      <input placeholder="Label (shown in the Agent panel)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
      <input placeholder="Base URL (e.g. http://localhost:11434/v1)" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
      <input placeholder="API key (optional — most local servers need none)" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
      {presetMatch && <p className="muted" style={{ margin: 0 }}>{presetMatch.hint}</p>}
      {err && <p className="error">{err}</p>}
      {msg && <p className="muted">{msg}</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn tiny" onClick={onTest}>Test</button>
        <button className="btn primary" onClick={onSave}>Save</button>
        <button className="btn tiny" onClick={onCancel}>Cancel</button>
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
