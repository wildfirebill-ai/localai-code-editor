import { useEffect, useState } from 'react';
import { useApp } from './state';
import type { SkillSummary } from './types';

export function SkillsPanel() {
  const { client, refresh } = useApp();
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setSkills(await client.request<SkillSummary[]>('skills.list'));
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    void load();
  }, [client]);

  const toggle = async (name: string) => {
    const expanded = !open[name];
    setOpen((o) => ({ ...o, [name]: expanded }));
    if (expanded && content[name] === undefined) {
      try {
        const s = await client.request<{ content: string }>('skills.read', { name });
        setContent((c) => ({ ...c, [name]: s.content }));
      } catch {
        /* ignore */
      }
    }
  };

  const setEnabled = async (name: string, enabled: boolean) => {
    await client.request('skills.setEnabled', { name, enabled });
    await refresh();
    await load();
  };

  return (
    <div className="settings-panel">
      <div className="panel-title">Agent Skills</div>
      <p className="muted" style={{ padding: '0 10px' }}>
        Project skills: <code>&lt;workspace&gt;/.localai/skills/&lt;name&gt;/SKILL.md</code>
        <br />
        Global skills: <code>~/.localai/skills/&lt;name&gt;/SKILL.md</code>
        <br />Project skills override same-named global skills.
      </p>
      {err && <p className="error">{err}</p>}
      {skills.length === 0 && <p className="muted" style={{ padding: '0 10px' }}>No skills found. Drop a SKILL.md into .localai/skills/&lt;name&gt;/ to add one.</p>}
      <ul className="changes">
        {skills.map((s) => (
          <li key={s.name} className="change" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div className="row">
              <span className={`dot ${s.enabled ? 'ok' : 'bad'}`} />
              <span className="change-path" onClick={() => void toggle(s.name)}>
                {s.name}
              </span>
              <span className="muted">{s.source} · {s.size} ch</span>
              <button className="btn tiny" onClick={() => void setEnabled(s.name, !s.enabled)}>
                {s.enabled ? 'Disable' : 'Enable'}
              </button>
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
  );
}