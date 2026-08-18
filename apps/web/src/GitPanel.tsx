import { useState } from 'react';
import { useApp } from './state';
import type { FileDiff, BranchInfo, GitLogEntry } from './types';

export function GitPanel({ onOpenDiff }: { onOpenDiff: (path: string) => void }) {
  const { client, status, refresh } = useApp();
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'changes' | 'branches' | 'log'>('changes');
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [log, setLog] = useState<GitLogEntry[]>([]);

  if (!status?.isRepo) {
    return <div className="git-panel"><p className="muted">Not a git repository.</p></div>;
  }

  const stage = async (paths: string[]) => {
    await client.request('git.stage', { paths });
    await refresh();
  };
  const unstage = async (paths: string[]) => {
    await client.request('git.unstage', { paths });
    await refresh();
  };
  const commit = async () => {
    if (!message.trim()) return;
    await client.request('git.commit', { message });
    setMessage('');
    await refresh();
  };
  const showDiff = async (path: string) => {
    const d = await client.request<FileDiff>('git.diff', { path, staged: false });
    setDiff(d);
    onOpenDiff(path);
  };
  const openBranches = async () => {
    setTab('branches');
    setBranches(await client.request<BranchInfo[]>('git.branches'));
  };
  const openLog = async () => {
    setTab('log');
    setLog(await client.request<GitLogEntry[]>('git.log', { limit: 30 }));
  };
  const checkout = async (name: string) => {
    await client.request('git.checkout', { name });
    await refresh();
  };
  const push = async () => {
    await client.request('git.push', { remote: 'origin', branch: status.current, setUpstream: true });
    await refresh();
  };
  const pull = async () => {
    await client.request('git.pull');
    await refresh();
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
        </div>
      </div>

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
                <span className="change-path" title={c.path} onClick={() => void showDiff(c.path)}>
                  {c.path}
                </span>
                {c.status === 'unstaged' && (
                  <button className="btn tiny" onClick={() => void stage([c.path])}>Stage</button>
                )}
                {c.status !== 'unstaged' && (
                  <button className="btn tiny" onClick={() => void unstage([c.path])}>Unstage</button>
                )}
              </li>
            ))}
          </ul>
          <div className="commit-box">
            <textarea
              placeholder="Commit message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <button className="btn primary" disabled={!message.trim()} onClick={commit}>
              Commit {status.ahead > 0 ? `(${status.ahead} ahead)` : ''}
            </button>
          </div>
          {diff && (
            <div className="diff-view">
              <div className="diff-head">{diff.path}</div>
              <pre>
                {diff.hunks.map((h, i) => (
                  <span key={i} className={`diff-${h.type}`}>{h.line}\n</span>
                ))}
              </pre>
            </div>
          )}
        </>
      )}

      {tab === 'branches' && (
        <ul className="changes">
          {branches.map((b) => (
            <li key={b.name} className="change">
              <span className="change-path">{b.current ? '* ' : ''}{b.name}</span>
              <span className="muted">
                {b.tracking ? `${b.ahead ?? 0}↑ ${b.behind ?? 0}↓` : 'local'}
              </span>
              {!b.current && <button className="btn tiny" onClick={() => void checkout(b.name)}>Checkout</button>}
            </li>
          ))}
        </ul>
      )}

      {tab === 'log' && (
        <ul className="changes">
          {log.map((e) => (
            <li key={e.hash} className="change">
              <span className="change-path muted">{e.shortHash} {e.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}