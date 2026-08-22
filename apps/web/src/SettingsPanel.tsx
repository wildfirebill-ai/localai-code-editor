import { useEffect, useState } from 'react';
import { useApp, getRecentWorkspaces } from './state';
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
  const [sysPrompt, setSysPrompt] = useState<string | null>(null);
  const [sysSaved, setSysSaved] = useState(false);
  const [lspForm, setLspForm] = useState<null | { id: string; language: string; extensions: string; command: string; args: string }>(null);
  const [lspErr, setLspErr] = useState('');
  const [wsInput, setWsInput] = useState('');
  const [wsErr, setWsErr] = useState('');
  const [recent] = useState(() => getRecentWorkspaces());

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

  useEffect(() => {
    let cancelled = false;
    client
      .request<{ exists: boolean }>('fs.stat', { path: '.localai/system.md' })
      .then(async (s) => {
        if (cancelled) return;
        if (!s.exists) return setSysPrompt('');
        const content = await client.request<string>('fs.read', { path: '.localai/system.md' });
        if (!cancelled) setSysPrompt(content);
      })
      .catch(() => !cancelled && setSysPrompt(''));
    return () => {
      cancelled = true;
    };
  }, [client, workspace]);

  // ---- Language servers ----

  const saveLsp = async () => {
    setLspErr('');
    if (!lspForm) return;
    try {
      await client.request('lsp.upsert', {
        id: lspForm.id.trim(),
        language: lspForm.language.trim(),
        extensions: lspForm.extensions.split(/[,\s]+/).filter(Boolean),
        command: lspForm.command.trim(),
        args: lspForm.args ? lspForm.args.split(/\s+/).filter(Boolean) : [],
      });
      setLspForm(null);
      await refresh();
    } catch (e) {
      setLspErr(e instanceof Error ? e.message : String(e));
    }
  };

  const removeLsp = async (id: string) => {
    try { await client.request('lsp.remove', { id }); await refresh(); } catch (e) {
      setLspErr(e instanceof Error ? e.message : String(e));
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
      {recent.length > 0 && (
        <>
          <div className="muted" style={{ padding: '0 10px 4px', fontSize: 11 }}>Recent workspaces</div>
          <ul className="changes" style={{ marginBottom: 8 }}>
            {recent.map((dir) => (
              <li key={dir} className="change">
                <span
                  className="change-path"
                  style={{ cursor: 'pointer', wordBreak: 'break-all' }}
                  title={dir}
                  onClick={() => void setWorkspace(dir).catch(() => {})}
                >
                  📁 {dir}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="panel-title">Agent Instructions (.localai/system.md)</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 4px', fontSize: 11 }}>
        Appended to every agent run in this workspace — conventions, guardrails, style rules.
      </p>
      <textarea
        className="system-prompt-editor"
        placeholder={"e.g. Always use TypeScript strict mode.\nNever touch files under vendor/.\nPrefer pnpm over npm."}
        value={sysPrompt ?? ''}
        onChange={(e) => { setSysPrompt(e.target.value); setSysSaved(false); }}
        rows={6}
        style={{ width: 'calc(100% - 20px)', margin: '0 10px 6px', fontFamily: 'monospace', fontSize: 12 }}
      />
      <div style={{ padding: '0 10px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          className="btn tiny primary"
          onClick={async () => {
            try {
              if ((sysPrompt ?? '').trim()) {
                await client.request('fs.write', { path: '.localai/system.md', content: sysPrompt ?? '' });
              } else {
                await client.request('fs.delete', { path: '.localai/system.md' }).catch(() => {});
              }
              setSysSaved(true);
              setTimeout(() => setSysSaved(false), 2000);
            } catch (e) {
              setSysSaved(false);
            }
          }}
        >
          Save instructions
        </button>
        {sysSaved && <span className="muted" style={{ fontSize: 11 }}>✓ saved — applies to next agent run</span>}
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
      <ul className="changes">
        {lspStatus.map((s) => (
          <li key={s.id} className="change">
            <span className={`dot ${s.running ? 'ok' : 'bad'}`} />
            <span className="change-path">{s.id} <span className="muted">({s.language})</span></span>
            <span className="muted">{s.running ? `pid ${s.pid}` : (s.error ?? 'not running')}</span>
            <button className="btn tiny" onClick={() => void removeLsp(s.id)}>Remove</button>
          </li>
        ))}
        {lspStatus.length === 0 && <li className="muted" style={{ listStyle: 'none' }}>None configured — install the binary (e.g. npm i -g typescript-language-server), then add it below.</li>}
      </ul>

      {lspForm === null ? (
        <button className="btn tiny" style={{ margin: '0 10px 10px' }} onClick={() => setLspForm({ id: '', language: '', extensions: '', command: '', args: '' })}>
          + Add language server
        </button>
      ) : (
        <div className="form" style={{ paddingBottom: 10 }}>
          <input placeholder="id (e.g. typescript)" value={lspForm.id} onChange={(e) => setLspForm({ ...lspForm, id: e.target.value })} />
          <input placeholder="language (e.g. typescript, python)" value={lspForm.language} onChange={(e) => setLspForm({ ...lspForm, language: e.target.value })} />
          <input placeholder="extensions (.ts,.tsx)" value={lspForm.extensions} onChange={(e) => setLspForm({ ...lspForm, extensions: e.target.value })} />
          <input placeholder="command (e.g. typescript-language-server)" value={lspForm.command} onChange={(e) => setLspForm({ ...lspForm, command: e.target.value })} />
          <input placeholder="args (--stdio)" value={lspForm.args} onChange={(e) => setLspForm({ ...lspForm, args: e.target.value })} />
          {lspErr && <p className="error">{lspErr}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn primary" onClick={() => void saveLsp()}>Save</button>
            <button className="btn tiny" onClick={() => setLspForm(null)}>Cancel</button>
          </div>
        </div>
      )}

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
