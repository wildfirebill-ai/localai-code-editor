import { useEffect, useState } from 'react';
import { useApp, getRecentWorkspaces } from './state';
import { McpDiscover } from './McpDiscover';
import type { ProviderInfo, SandboxStatus } from './types';

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
  const { client, workspace, setWorkspace, providers, providerHealth, mcpStatus, mcpTools, lspStatus, refresh, settings, updateSettings } = useApp();

  const [form, setForm] = useState<McpForm>(EMPTY_MCP);
  const [err, setErr] = useState('');
  const [sysPrompt, setSysPrompt] = useState<string | null>(null);
  const [sysSaved, setSysSaved] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ currentVersion: string; latestVersion: string; hasUpdate: boolean; releaseUrl?: string } | null>(null);
  const [autoCheckUpdates, setAutoCheckUpdates] = useState(() => localStorage.getItem('localai.autoCheckUpdates') !== '0');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [memoryNotes, setMemoryNotes] = useState<{ key: string; content: string; category: string; updated: string }[]>([]);
  const [memoryKey, setMemoryKey] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryCategory, setMemoryCategory] = useState('general');
  const [memorySaved, setMemorySaved] = useState(false);
  const [lspForm, setLspForm] = useState<null | { id: string; language: string; extensions: string; command: string; args: string }>(null);
  const [lspErr, setLspErr] = useState('');
  const [wsInput, setWsInput] = useState('');
  const [wsErr, setWsErr] = useState('');
  const [recent] = useState(() => getRecentWorkspaces());

  const [provForm, setProvForm] = useState<ProvForm>(EMPTY_PROV);
  const [provEditing, setProvEditing] = useState<string | null>(null);
  const [provErr, setProvErr] = useState('');
  const [provMsg, setProvMsg] = useState('');
  const [sandbox, setSandbox] = useState<SandboxStatus>({ available: false, running: false });
  const [sandboxImage, setSandboxImage] = useState('node:22-alpine');
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [sandboxCmd, setSandboxCmd] = useState('');

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

  // ---- Sandbox ----

  const refreshSandbox = async () => {
    try {
      const s = await client.request<SandboxStatus>('sandbox.status');
      setSandbox(s);
    } catch { /* ignore */ }
  };

  const startSandbox = async () => {
    try {
      setSandboxOutput('Starting sandbox…');
      const r = await client.request<{ ok: boolean; containerId?: string; error?: string }>('sandbox.start', { image: sandboxImage });
      if (r.ok) {
        setSandboxOutput(`Sandbox started: ${r.containerId?.slice(0, 12)}`);
        await refreshSandbox();
      } else {
        setSandboxOutput(`Error: ${r.error}`);
      }
    } catch (e) {
      setSandboxOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const stopSandbox = async () => {
    try {
      await client.request('sandbox.stop');
      setSandboxOutput('Sandbox stopped.');
      await refreshSandbox();
    } catch (e) {
      setSandboxOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const execSandbox = async () => {
    if (!sandboxCmd.trim()) return;
    try {
      const r = await client.request<{ ok: boolean; stdout: string; stderr: string; exitCode: number }>('sandbox.exec', { command: sandboxCmd });
      setSandboxOutput(r.ok ? r.stdout || '(no output)' : `Exit ${r.exitCode}: ${r.stderr || r.stdout}`);
    } catch (e) {
      setSandboxOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  useEffect(() => { void refreshSandbox(); }, [client]);

  // ---- Update Checker ----
  const checkUpdates = async () => {
    try {
      const info = await client.request<{ currentVersion: string; latestVersion: string; hasUpdate: boolean; releaseUrl?: string }>('update.check');
      setUpdateInfo(info);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (autoCheckUpdates) void checkUpdates();
  }, [client, autoCheckUpdates]);

  const fetchReleaseNotes = async () => {
    try {
      const result = await client.request<{ notes: string }>('update.releaseNotes', { version: updateInfo?.latestVersion });
      setReleaseNotes(result.notes);
      setShowReleaseNotes(true);
    } catch {
      // Fallback: open in browser
      if (updateInfo?.releaseUrl) window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  const applyUpdate = async () => {
    setUpdating(true);
    setUpdateMsg('Updating...');
    try {
      const result = await client.request<{ ok: boolean; message: string; version?: string }>('update.apply');
      setUpdateMsg(result.message);
      if (result.ok && result.version) {
        setUpdateInfo((prev) => prev ? { ...prev, hasUpdate: false, latestVersion: result.version! } : null);
      }
    } catch (e) {
      setUpdateMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setUpdating(false);
  };

  // ---- Agent Memory ----
  const loadMemory = async () => {
    try {
      const notes = await client.request<{ key: string; content: string; category: string; updated: string }[]>('memory.list');
      setMemoryNotes(notes);
    } catch { /* ignore */ }
  };

  useEffect(() => { void loadMemory(); }, [client, workspace]);

  const saveMemory = async () => {
    if (!memoryKey.trim()) return;
    try {
      await client.request('memory.write', { key: memoryKey.trim(), content: memoryContent, category: memoryCategory });
      setMemorySaved(true);
      setTimeout(() => setMemorySaved(false), 2000);
      setMemoryKey('');
      setMemoryContent('');
      await loadMemory();
    } catch { /* ignore */ }
  };

  const deleteMemory = async (key: string) => {
    try {
      await client.request('memory.delete', { key });
      await loadMemory();
    } catch { /* ignore */ }
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

      <div className="panel-title">Editor Settings</div>
      <div className="editor-settings" style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 11 }}>Theme:</span>
          <select
            value={settings.theme}
            onChange={(e) => updateSettings('theme', e.target.value as typeof settings.theme)}
            style={{ fontSize: 11 }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="high-contrast">High Contrast</option>
            <option value="system">System</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.autoSave} onChange={(e) => updateSettings('autoSave', e.target.checked)} />
          Auto-save files
        </label>
        {settings.autoSave && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 24 }}>
            <span className="muted" style={{ fontSize: 11 }}>Delay:</span>
            <input
              type="number" min={100} max={5000} step={100}
              value={settings.autoSaveDelay}
              onChange={(e) => updateSettings('autoSaveDelay', parseInt(e.target.value, 10) || 1000)}
              style={{ width: 80 }}
            />
            <span className="muted" style={{ fontSize: 11 }}>ms</span>
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.showMinimap} onChange={(e) => updateSettings('showMinimap', e.target.checked)} />
          Show minimap
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 11 }}>Font size:</span>
          <input
            type="number" min={10} max={32}
            value={settings.fontSize}
            onChange={(e) => updateSettings('fontSize', parseInt(e.target.value, 10) || 14)}
            style={{ width: 60 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.wordWrap === 'on'} onChange={(e) => updateSettings('wordWrap', e.target.checked ? 'on' : 'off')} />
          Word wrap
        </label>
      </div>

      <div className="panel-title">Agent Instructions (.localai/system.md)</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 4px', fontSize: 11 }}>
        Appended to every agent run — conventions, guardrails, style rules.
        <br />Variables: <code>{'{{workspace}}'}</code> <code>{'{{git_branch}}'}</code> <code>{'{{date}}'}</code> <code>{'{{time}}'}</code> <code>{'{{weekday}}'}</code>
      </p>
      <div style={{ padding: '0 10px 6px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: 11, lineHeight: '22px' }}>Presets:</span>
        {[
          { label: 'Code Assistant', prompt: 'You are a helpful coding assistant.\n- Write clean, typed code\n- Prefer functional patterns\n- Add error handling\n- Write tests for new logic' },
          { label: 'Security Reviewer', prompt: 'You are a security-focused code reviewer.\n- Check for injection vulnerabilities\n- Verify auth/authz on all endpoints\n- Flag hardcoded secrets\n- Suggest OWASP-compliant fixes' },
          { label: 'DevOps Helper', prompt: 'You are a DevOps engineer assistant.\n- Write reproducible Dockerfiles\n- Use multi-stage builds\n- Follow 12-factor app principles\n- Prefer docker-compose for local dev' },
          { label: 'Refactor Expert', prompt: 'You are a refactoring specialist.\n- Extract small, focused functions\n- Remove dead code\n- Simplify conditionals\n- Improve naming for clarity' },
        ].map((preset) => (
          <button
            key={preset.label}
            className="btn tiny"
            onClick={() => { setSysPrompt(preset.prompt); setSysSaved(false); }}
            title={preset.prompt}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <textarea
        className="system-prompt-editor"
        placeholder={"e.g. Always use TypeScript strict mode.\nNever touch files under vendor/.\nPrefer pnpm over npm."}
        value={sysPrompt ?? ''}
        onChange={(e) => { setSysPrompt(e.target.value); setSysSaved(false); }}
        rows={8}
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
            } catch {
              setSysSaved(false);
            }
          }}
        >
          Save instructions
        </button>
        {sysSaved && <span className="muted" style={{ fontSize: 11 }}>&#10003; saved &mdash; applies to next agent run</span>}
        <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{(sysPrompt ?? '').length} chars</span>
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

      <div className="panel-title">Sandbox (Docker-in-Docker)</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 4px', fontSize: 11 }}>
        Run agent commands in an isolated Docker container — no host filesystem access.
      </p>
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`dot ${sandbox.available ? (sandbox.running ? 'ok' : '') : 'bad'}`} />
          <span className="muted" style={{ fontSize: 12 }}>
            {!sandbox.available ? 'Docker not available' : sandbox.running ? `Running (${sandbox.containerId?.slice(0, 12) ?? ''})` : 'Stopped'}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 11 }}>Image:</span>
          <input value={sandboxImage} onChange={(e) => setSandboxImage(e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }} placeholder="node:22-alpine" />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {sandbox.running ? (
            <button className="btn tiny" onClick={stopSandbox}>Stop</button>
          ) : (
            <button className="btn primary" onClick={startSandbox} disabled={!sandbox.available}>Start</button>
          )}
          <button className="btn tiny" onClick={refreshSandbox}>Refresh</button>
        </div>
        {sandbox.running && (
          <>
            <input
              placeholder="Run command in sandbox…"
              value={sandboxCmd}
              onChange={(e) => setSandboxCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void execSandbox()}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <button className="btn tiny" onClick={execSandbox}>Run</button>
          </>
        )}
        {sandboxOutput && (
          <pre style={{ margin: 0, padding: 8, background: 'var(--bg-editor)', borderRadius: 4, fontSize: 11, maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {sandboxOutput}
          </pre>
        )}
      </div>

      <div className="panel-title">Updates</div>
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoCheckUpdates}
            onChange={(e) => {
              setAutoCheckUpdates(e.target.checked);
              localStorage.setItem('localai.autoCheckUpdates', e.target.checked ? '1' : '0');
            }}
          />
          Check for updates on startup
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn tiny" onClick={checkUpdates}>Check now</button>
          {updateInfo && (
            <span className="muted" style={{ fontSize: 11 }}>
              v{updateInfo.currentVersion}
              {updateInfo.hasUpdate ? (
                <span style={{ color: 'var(--yellow)' }}> → v{updateInfo.latestVersion} available!</span>
              ) : (
                <span style={{ color: 'var(--green)' }}> ✓ up to date</span>
              )}
            </span>
          )}
        </div>
        {updateInfo?.hasUpdate && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn primary" disabled={updating} onClick={applyUpdate}>
              {updating ? 'Updating…' : `Update to v${updateInfo.latestVersion}`}
            </button>
            <button className="btn tiny" onClick={fetchReleaseNotes}>Release notes</button>
          </div>
        )}

        {/* Release Notes Modal */}
        {showReleaseNotes && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowReleaseNotes(false)}>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, width: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Release Notes — v{updateInfo?.latestVersion}</div>
                <button className="btn tiny" onClick={() => setShowReleaseNotes(false)}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {releaseNotes || 'Loading release notes…'}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {updateInfo?.releaseUrl && (
                  <a href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer" className="btn tiny" style={{ background: 'transparent', color: 'var(--fg-muted)' }}>
                    Open on GitHub
                  </a>
                )}
                <button className="btn tiny" onClick={() => setShowReleaseNotes(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
        {updateMsg && <p className="muted" style={{ fontSize: 11, margin: 0 }}>{updateMsg}</p>}
      </div>

      <div className="panel-title">Agent Memory</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 4px', fontSize: 11 }}>
        Persistent notes the agent reads for context — build steps, config, important findings.
      </p>
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <input placeholder="Key (e.g. build-steps, config-notes)" value={memoryKey} onChange={(e) => setMemoryKey(e.target.value)} style={{ fontSize: 12 }} />
        <textarea
          placeholder="Content — the agent reads this for context"
          value={memoryContent}
          onChange={(e) => setMemoryContent(e.target.value)}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={memoryCategory} onChange={(e) => setMemoryCategory(e.target.value)} style={{ fontSize: 11 }}>
            <option value="general">General</option>
            <option value="build">Build</option>
            <option value="config">Config</option>
            <option value="findings">Findings</option>
            <option value="decisions">Decisions</option>
          </select>
          <button className="btn tiny primary" onClick={saveMemory}>Save</button>
          {memorySaved && <span className="muted" style={{ fontSize: 11 }}>&#10003; saved</span>}
        </div>
        {memoryNotes.length > 0 && (
          <ul className="changes" style={{ marginTop: 4 }}>
            {memoryNotes.map((n) => (
              <li key={n.key} className="change" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <div className="row">
                  <span className="change-path" style={{ cursor: 'pointer' }} onClick={() => { setMemoryKey(n.key); setMemoryContent(n.content); setMemoryCategory(n.category); }}>
                    {n.key}
                  </span>
                  <span className="muted" style={{ fontSize: 10 }}>{n.category}</span>
                  {n.updated && <span className="muted" style={{ fontSize: 10 }}>{n.updated}</span>}
                  <button className="btn tiny" onClick={() => void deleteMemory(n.key)}>×</button>
                </div>
                <pre style={{ margin: 0, fontSize: 10, maxHeight: 60, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{n.content.slice(0, 200)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel-title">MCP Servers</div>
      <McpDiscover
        mcpStatus={mcpStatus}
        client={client}
        refresh={refresh}
      />

      <div className="panel-title">Connected Tools ({mcpTools.length})</div>
      <McpToolDiscovery tools={mcpTools} />
      <ToolDescriptions tools={mcpTools} client={client} workspace={workspace} />

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

function ToolDescriptions({ tools, client, workspace }: { tools: import('./types').McpTool[]; client: { request: <T>(m: string, p?: Record<string, unknown>) => Promise<T> }; workspace: string }) {
  const [descs, setDescs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .request<{ exists: boolean }>('fs.stat', { path: '.localai/tool-descriptions.json' })
      .then(async (s) => {
        if (cancelled) return;
        if (!s.exists) return setDescs({});
        const content = await client.request<string>('fs.read', { path: '.localai/tool-descriptions.json' });
        if (!cancelled) try { setDescs(JSON.parse(content)); } catch { setDescs({}); }
      })
      .catch(() => !cancelled && setDescs({}));
    return () => { cancelled = true; };
  }, [client, workspace]);

  if (tools.length === 0) return null;

  const save = async () => {
    try {
      const filtered = Object.fromEntries(Object.entries(descs).filter(([, v]) => v.trim()));
      if (Object.keys(filtered).length === 0) {
        await client.request('fs.delete', { path: '.localai/tool-descriptions.json' }).catch(() => {});
      } else {
        await client.request('fs.write', { path: '.localai/tool-descriptions.json', content: JSON.stringify(filtered, null, 2) });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ padding: '0 10px 10px' }}>
      <p className="muted" style={{ fontSize: 11, margin: '0 0 6px' }}>
        Custom tool descriptions override what the agent sees. Leave blank to use the tool's default.
      </p>
      {tools.slice(0, 15).map((t) => (
        <div key={t.name} style={{ marginBottom: 4 }}>
          <label className="muted" style={{ fontSize: 11 }}>{t.name}</label>
          <input
            value={descs[t.name] ?? ''}
            placeholder={t.description ?? 'No description'}
            onChange={(e) => setDescs((d) => ({ ...d, [t.name]: e.target.value }))}
            style={{ width: '100%', fontSize: 11, fontFamily: 'monospace' }}
          />
        </div>
      ))}
      {tools.length > 15 && <p className="muted" style={{ fontSize: 10 }}>…and {tools.length - 15} more</p>}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
        <button className="btn tiny primary" onClick={save}>Save descriptions</button>
        {saved && <span className="muted" style={{ fontSize: 11 }}>&#10003; saved</span>}
      </div>
    </div>
  );
}

function McpToolDiscovery({ tools }: { tools: import('./types').McpTool[] }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Group tools by server
  const grouped = tools.reduce<Record<string, import('./types').McpTool[]>>((acc, t) => {
    (acc[t.server] ??= []).push(t);
    return acc;
  }, {});

  const filtered = tools.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      t.server.toLowerCase().includes(q)
    );
  });

  if (tools.length === 0) {
    return <p className="muted" style={{ padding: '0 10px', fontSize: 11 }}>No tools connected. Add an MCP server above.</p>;
  }

  return (
    <div style={{ padding: '0 10px 10px' }}>
      <input
        placeholder="Search tools…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 6, fontFamily: 'monospace', fontSize: 11 }}
      />
      {search ? (
        <ul className="tools" style={{ maxHeight: 200, overflowY: 'auto' }}>
          {filtered.map((t) => (
            <li key={`${t.server}:${t.name}`} title={t.description ?? ''} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <code>{t.name}</code>
              <span className="muted" style={{ fontSize: 10 }}>{t.server}</span>
              {t.description && <span className="muted" style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{t.description}</span>}
            </li>
          ))}
          {filtered.length === 0 && <li className="muted" style={{ listStyle: 'none' }}>No tools match "{search}"</li>}
        </ul>
      ) : (
        Object.entries(grouped).map(([server, serverTools]) => (
          <div key={server} style={{ marginBottom: 6 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}
              onClick={() => setExpanded((e) => ({ ...e, [server]: !e[server] }))}
            >
              <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>
                {expanded[server] ? '▼' : '▶'} {server}
              </span>
              <span className="muted" style={{ fontSize: 10 }}>({serverTools.length})</span>
            </div>
            {expanded[server] && (
              <ul className="tools" style={{ marginLeft: 12, maxHeight: 150, overflowY: 'auto' }}>
                {serverTools.map((t) => (
                  <li key={t.name} title={t.description ?? ''} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <code>{t.name}</code>
                    {t.description && <span className="muted" style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250 }}>{t.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}
