import { useEffect, useState } from 'react';
import { useApp } from './state';
import { SKILL_REGISTRY, SKILL_CATEGORIES, PROJECT_SKILL_MAP, type SkillRegistryEntry } from './skills-registry';
import type { SkillSummary } from './types';

export function SkillsPanel() {
  const { client, refresh } = useApp();
  const [tab, setTab] = useState<'installed' | 'discover'>('installed');
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setSkills(await client.request<SkillSummary[]>('skills.list'));
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => { void load(); }, [client]);

  const toggle = async (name: string) => {
    const expanded = !open[name];
    setOpen((o) => ({ ...o, [name]: expanded }));
    if (expanded && content[name] === undefined) {
      try {
        const s = await client.request<{ content: string }>('skills.read', { name });
        setContent((c) => ({ ...c, [name]: s.content }));
      } catch { /* ignore */ }
    }
  };

  const setEnabled = async (name: string, enabled: boolean) => {
    await client.request('skills.setEnabled', { name, enabled });
    await refresh();
    await load();
  };

  const { workspace } = useApp();
  const installedNames = new Set(skills.map((s) => s.name));

  // Workspace-aware skill suggestions
  const suggestedSkills = (() => {
    const ws = workspace.toLowerCase();
    const categories = new Set<string>();
    // Match project indicators
    for (const [indicator, cats] of Object.entries(PROJECT_SKILL_MAP)) {
      if (ws.includes(indicator.replace('/', '').replace('.', '').toLowerCase())) {
        cats.forEach((c) => categories.add(c));
      }
    }
    // Default suggestions based on common workspace patterns
    if (ws.includes('frontend') || ws.includes('web') || ws.includes('ui')) {
      ['frontend', 'quality'].forEach((c) => categories.add(c));
    }
    if (ws.includes('api') || ws.includes('server') || ws.includes('backend')) {
      ['backend', 'security'].forEach((c) => categories.add(c));
    }
    if (ws.includes('infra') || ws.includes('ops') || ws.includes('deploy')) {
      ['devops', 'docker'].forEach((c) => categories.add(c));
    }
    if (categories.size === 0) {
      // Fallback: suggest quality and security for any project
      ['quality', 'security'].forEach((c) => categories.add(c));
    }
    return SKILL_REGISTRY.filter((s) => categories.has(s.category) && !installedNames.has(s.id)).slice(0, 6);
  })();

  const filteredRegistry = SKILL_REGISTRY.filter((s) => {
    if (category !== 'all' && s.category !== category) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const installSkill = async (entry: SkillRegistryEntry) => {
    try {
      const contentMd = entry.content ?? `# ${entry.name}\n\n${entry.description}\n`;
      await client.request('skills.install', {
        name: entry.id,
        content: contentMd,
        category: entry.category,
        description: entry.description,
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const uninstallSkill = async (name: string) => {
    try {
      await client.request('skills.uninstall', { name });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-title">Agent Skills</div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 8, padding: '0 10px 8px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <button className={`btn ${tab === 'installed' ? 'primary' : 'subtle'}`} onClick={() => setTab('installed')}>
          Installed ({skills.length})
        </button>
        <button className={`btn ${tab === 'discover' ? 'primary' : 'subtle'}`} onClick={() => setTab('discover')}>
          Discover ({SKILL_REGISTRY.length})
        </button>
      </div>

      {err && <p className="error">{err}</p>}

      {tab === 'installed' ? (
        <div>
          <p className="muted" style={{ padding: '0 10px', margin: '0 0 4px', fontSize: 11 }}>
            Project: <code>&lt;workspace&gt;/.localai/skills/</code> &middot; Global: <code>~/.localai/skills/</code>
          </p>
          {suggestedSkills.length > 0 && (
            <div style={{ padding: '0 10px 8px' }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>&#9733; Suggested for this workspace</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {suggestedSkills.map((s) => (
                  <button
                    key={s.id}
                    className="btn tiny"
                    onClick={() => void installSkill(s)}
                    title={s.description}
                    style={{ fontSize: 11 }}
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {skills.length === 0 && <p className="muted" style={{ padding: '0 10px' }}>No skills installed. Browse the Discover tab or use suggestions above.</p>}
          <ul className="changes">
            {skills.map((s) => (
              <li key={s.name} className="change" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <div className="row">
                  <span className={`dot ${s.enabled ? 'ok' : 'bad'}`} />
                  <span className="change-path" onClick={() => void toggle(s.name)}>{s.name}</span>
                  <span className="muted">{s.source} &middot; {s.category} &middot; {s.size} ch</span>
                  <button className="btn tiny" onClick={() => void setEnabled(s.name, !s.enabled)}>
                    {s.enabled ? 'Disable' : 'Enable'}
                  </button>
                  {s.source !== 'builtin' && (
                    <button className="btn tiny" onClick={() => void uninstallSkill(s.name)}>Remove</button>
                  )}
                </div>
                {s.description && <span className="muted" style={{ paddingLeft: 20 }}>{s.description}</span>}
                {open[s.name] && (
                  <pre className="skill-body" style={{ margin: '4px 0 0 20px' }}>
                    {content[s.name] ?? 'loading…'}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Discover view */
        <div>
          <div style={{ padding: '0 10px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Search skills…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 140 }}>
              <option value="all">All Categories</option>
              {SKILL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div style={{ padding: '0 10px', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRegistry.map((entry) => {
              const installed = installedNames.has(entry.id);
              return (
                <div key={entry.id} className="mcp-discover-card" style={{
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 12,
                  background: installed ? 'rgba(255, 200, 0, 0.1)' : 'var(--bg-panel)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.name}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{entry.category}</div>
                    </div>
                    <span className={installed ? 'dot ok' : 'dot'} title={installed ? 'Installed' : 'Not installed'} />
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{entry.description}</div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--fg-muted)', flexWrap: 'wrap' }}>
                    {entry.tags?.slice(0, 4).map((t) => (
                      <span key={t} style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {installed ? (
                      <button className="btn tiny" onClick={() => void uninstallSkill(entry.id)}>Remove</button>
                    ) : (
                      <button className="btn primary" onClick={() => void installSkill(entry)}>Install</button>
                    )}
                    {entry.homepage && (
                      <a href={entry.homepage} target="_blank" rel="noopener noreferrer" className="btn tiny" style={{ background: 'transparent', color: 'var(--fg-muted)' }}>Docs</a>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredRegistry.length === 0 && <p className="muted" style={{ padding: '0 10px' }}>No skills match your search.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
