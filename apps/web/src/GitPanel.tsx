import { useState } from 'react';
import { useApp } from './state';
import type { FileDiff, BranchInfo, GitLogEntry } from './types';

export function GitPanel({ onOpenDiff }: { onOpenDiff: (path: string) => void }) {
  const { client, status, refresh } = useApp();
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'changes' | 'branches' | 'log' | 'stash'>('changes');
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [log, setLog] = useState<GitLogEntry[]>([]);
  const [stashList, setStashList] = useState<{ index: number; message: string; hash: string }[]>([]);
  const [showCommitEditor, setShowCommitEditor] = useState(false);
  const [commitEditorMsg, setCommitEditorMsg] = useState('');
  const [logDiff, setLogDiff] = useState<Record<string, FileDiff> | null>(null);
  const [logDiffHash, setLogDiffHash] = useState('');
  const [compareFrom, setCompareFrom] = useState('');
  const [compareTo, setCompareTo] = useState('');
  const [compareDiff, setCompareDiff] = useState<Record<string, FileDiff> | null>(null);

  if (!status?.isRepo) {
    return <div className="git-panel"><p className="muted">Not a git repository.</p></div>;
  }

  const stage = async (paths: string[]) => { await client.request('git.stage', { paths }); await refresh(); };
  const unstage = async (paths: string[]) => { await client.request('git.unstage', { paths }); await refresh(); };
  const commit = async (msg?: string) => {
    const m = msg ?? message;
    if (!m.trim()) return;
    await client.request('git.commit', { message: m });
    setMessage('');
    setCommitEditorMsg('');
    setShowCommitEditor(false);
    await refresh();
  };
  const showDiff = async (path: string) => {
    const d = await client.request<FileDiff>('git.diff', { path, staged: false });
    setDiff(d);
    onOpenDiff(path);
  };
  const openBranches = async () => { setTab('branches'); setBranches(await client.request<BranchInfo[]>('git.branches')); };
  const openLog = async () => { setTab('log'); setLog(await client.request<GitLogEntry[]>('git.log', { limit: 30 })); setLogDiff(null); };
  const openStash = async () => { setTab('stash'); setStashList(await client.request<{ index: number; message: string; hash: string }[]>('git.stashList')); };
  const checkout = async (name: string) => { await client.request('git.checkout', { name }); await refresh(); };
  const push = async () => { await client.request('git.push', { remote: 'origin', branch: status.current, setUpstream: true }); await refresh(); };
  const pull = async () => { await client.request('git.pull'); await refresh(); };

  // Stash
  const doStash = async () => {
    await client.request('git.stash', { message: commitEditorMsg || undefined });
    setCommitEditorMsg('');
    await openStash();
    await refresh();
  };
  const doStashPop = async () => { await client.request('git.stashPop'); await openStash(); await refresh(); };
  const doStashDrop = async (index: number) => { await client.request('git.stashDrop', { index }); await openStash(); };

  // Log diff preview
  const showLogDiff = async (hash: string) => {
    if (logDiffHash === hash) { setLogDiff(null); setLogDiffHash(''); return; }
    const diffs = await client.request<Record<string, FileDiff>>('git.diff', { path: `${hash}~1`, staged: false });
    // Fallback: use the commit hash with diff
    try {
      const raw = await client.request<FileDiff>('git.diff', { path: hash, staged: false });
      setLogDiff({ [raw.path]: raw });
    } catch {
      setLogDiff(diffs);
    }
    setLogDiffHash(hash);
  };

  // Branch comparison
  const doCompare = async () => {
    if (!compareFrom || !compareTo) return;
    const diffs = await client.request<Record<string, FileDiff>>('git.diffBranches', { from: compareFrom, to: compareTo });
    setCompareDiff(diffs);
  };

  return (
    <div className="git-panel">
      <div className="panel-title">Source Control</div>
      <div className="branch-bar">
        <span className="branch-name">🗂 {status.branch}</span>
        {status.ahead > 0 && <span className="sync">{status.ahead}↑</span>}
        {status.behind > 0 && <span className="sync">{status.behind}↓</span>}
        <div className="row">
          <button className="btn subtle" onClick={pull}>Pull</button>
          <button className="btn subtle" onClick={push}>Push</button>
          <button className="btn subtle" onClick={openBranches}>Branches</button>
          <button className="btn subtle" onClick={openLog}>Log</button>
          <button className="btn subtle" onClick={openStash}>Stash</button>
        </div>
      </div>

      {/* ---- Changes Tab ---- */}
      {tab === 'changes' && (
        <>
          <div className="changes-head">
            <button className="btn subtle" onClick={async () => { await client.request('git.stageAll'); await refresh(); }}>Stage All</button>
            <span className="muted">{status.changes.length} changed</span>
          </div>
          <ul className="changes">
            {status.changes.map((c) => (
              <li key={c.path} className="change">
                <span className={`chg-badge ${c.changeType}`}>{c.changeType[0]}</span>
                <span className="change-path" title={c.path} onClick={() => void showDiff(c.path)}>{c.path}</span>
                {c.status === 'unstaged' && <button className="btn tiny" onClick={() => void stage([c.path])}>Stage</button>}
                {c.status !== 'unstaged' && <button className="btn tiny" onClick={() => void unstage([c.path])}>Unstage</button>}
              </li>
            ))}
          </ul>
          <div className="commit-box">
            <textarea
              placeholder="Commit message (or click Edit to open editor)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <div className="row" style={{ gap: 4 }}>
              <button className="btn tiny" onClick={() => { setCommitEditorMsg(message); setShowCommitEditor(true); }}>Edit</button>
              <button className="btn primary" disabled={!message.trim()} onClick={() => void commit()}>
                Commit {status.ahead > 0 ? `(${status.ahead} ahead)` : ''}
              </button>
            </div>
          </div>
          {diff && (
            <div className="diff-view">
              <div className="diff-head">{diff.path}</div>
              <pre>{diff.hunks.map((h, i) => <span key={i} className={`diff-${h.type}`}>{h.line}{'\n'}</span>)}</pre>
            </div>
          )}
        </>
      )}

      {/* ---- Commit Editor Modal ---- */}
      {showCommitEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCommitEditor(false)}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Commit Message Editor</div>
            <textarea
              value={commitEditorMsg}
              onChange={(e) => { setCommitEditorMsg(e.target.value); setMessage(e.target.value); }}
              rows={8}
              style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical', flex: 1 }}
              placeholder="feat: add new feature&#10;&#10;Detailed description of the change.&#10;&#10;Closes #123"
              autoFocus
            />
            <div className="muted" style={{ fontSize: 11 }}>{commitEditorMsg.length} chars</div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn primary" disabled={!commitEditorMsg.trim()} onClick={() => void commit(commitEditorMsg)}>Commit</button>
              <button className="btn subtle" onClick={() => setShowCommitEditor(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Branches Tab ---- */}
      {tab === 'branches' && (
        <>
          <ul className="changes">
            {branches.map((b) => (
              <li key={b.name} className="change">
                <span className="change-path">{b.current ? '* ' : ''}{b.name}</span>
                <span className="muted">{b.tracking ? `${b.ahead ?? 0}↑ ${b.behind ?? 0}↓` : 'local'}</span>
                {!b.current && <button className="btn tiny" onClick={() => void checkout(b.name)}>Checkout</button>}
              </li>
            ))}
          </ul>
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Compare branches</div>
            <div className="row" style={{ gap: 4 }}>
              <select value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} style={{ fontSize: 11 }}>
                <option value="">From…</option>
                {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <span className="muted">→</span>
              <select value={compareTo} onChange={(e) => setCompareTo(e.target.value)} style={{ fontSize: 11 }}>
                <option value="">To…</option>
                {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <button className="btn tiny" disabled={!compareFrom || !compareTo} onClick={doCompare}>Diff</button>
            </div>
            {compareDiff && (
              <div style={{ marginTop: 6, maxHeight: 200, overflowY: 'auto' }}>
                {Object.keys(compareDiff).length === 0 && <p className="muted" style={{ fontSize: 11 }}>No differences</p>}
                {Object.entries(compareDiff).map(([path, d]) => (
                  <div key={path} style={{ marginBottom: 4 }}>
                    <div className="change-path" style={{ fontSize: 11 }}>{path}</div>
                    <pre style={{ margin: 0, fontSize: 10, maxHeight: 80, overflow: 'hidden' }}>
                      {d.hunks.slice(0, 10).map((h, i) => <span key={i} className={`diff-${h.type}`}>{h.line}{'\n'}</span>)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ---- Log Tab ---- */}
      {tab === 'log' && (
        <ul className="changes">
          {log.map((e) => (
            <li key={e.hash} className="change" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <div className="row" style={{ width: '100%' }}>
                <span className="change-path" style={{ cursor: 'pointer' }} onClick={() => void showLogDiff(e.hash)}>
                  {e.shortHash} {e.message}
                </span>
                <span className="muted" style={{ fontSize: 10, marginLeft: 'auto' }}>{e.author} · {e.date}</span>
              </div>
              {logDiffHash === e.hash && logDiff && (
                <div style={{ width: '100%', maxHeight: 150, overflowY: 'auto', marginTop: 4 }}>
                  {Object.entries(logDiff).map(([path, d]) => (
                    <div key={path}>
                      <div className="muted" style={{ fontSize: 10 }}>{path}</div>
                      <pre style={{ margin: 0, fontSize: 10, maxHeight: 80, overflow: 'hidden' }}>
                        {d.hunks.slice(0, 15).map((h, i) => <span key={i} className={`diff-${h.type}`}>{h.line}{'\n'}</span>)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ---- Stash Tab ---- */}
      {tab === 'stash' && (
        <>
          <div style={{ padding: '6px 10px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              placeholder="Stash message (optional)"
              value={commitEditorMsg}
              onChange={(e) => setCommitEditorMsg(e.target.value)}
              style={{ flex: 1, fontSize: 11 }}
            />
            <button className="btn tiny primary" onClick={doStash}>Stash</button>
            <button className="btn tiny" onClick={doStashPop} disabled={stashList.length === 0}>Pop</button>
          </div>
          {stashList.length === 0 && <p className="muted" style={{ padding: '0 10px', fontSize: 11 }}>No stashes</p>}
          <ul className="changes">
            {stashList.map((s) => (
              <li key={s.index} className="change">
                <span className="change-path">stash@{'{'}{s.index}{'}'}</span>
                <span className="muted" style={{ fontSize: 11 }}>{s.message}</span>
                <button className="btn tiny" onClick={() => void doStashDrop(s.index)}>Drop</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
