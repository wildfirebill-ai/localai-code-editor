import { useEffect, useRef, useState } from 'react';
import { useApp } from './state';

interface Hit {
  path: string;
  line: number;
  text: string;
}

/** Workspace-wide text search panel. */
export function SearchPanel({ onOpen }: { onOpen: (path: string) => void }) {
  const { client } = useApp();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');
  const seqRef = useRef(0);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const seq = ++seqRef.current;
    setSearching(true);
    setErr('');
    try {
      const res = await client.request<Hit[]>('fs.search', { query: q });
      if (seq === seqRef.current) setHits(res);
    } catch (e) {
      if (seq === seqRef.current) setErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (seq === seqRef.current) setSearching(false);
    }
  };

  // Group hits by file.
  const grouped = new Map<string, Hit[]>();
  for (const h of hits ?? []) {
    const list = grouped.get(h.path) ?? [];
    list.push(h);
    grouped.set(h.path, list);
  }

  useEffect(() => {
    const input = document.getElementById('search-input') as HTMLInputElement | null;
    input?.focus();
  }, []);

  return (
    <div className="settings-panel">
      <div className="panel-title">Search</div>
      <div className="form" style={{ paddingBottom: 8 }}>
        <input
          id="search-input"
          placeholder="Search across all files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
        />
        <button className="btn primary" onClick={() => void runSearch()} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>
      {err && <p className="error" style={{ padding: '0 10px' }}>{err}</p>}
      {hits !== null && !searching && (
        <p className="muted" style={{ padding: '0 10px', margin: '0 0 6px' }}>
          {hits.length} match{hits.length === 1 ? '' : 'es'} in {grouped.size} file{grouped.size === 1 ? '' : 's'}
        </p>
      )}
      <ul className="changes" style={{ overflowY: 'auto' }}>
        {[...grouped.entries()].map(([file, lines]) => (
          <li key={file} style={{ marginBottom: 8 }}>
            <div
              className="change-path"
              style={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => onOpen(file)}
              title="Open file"
            >
              📄 {file}
            </div>
            <ul style={{ listStyle: 'none', margin: '2px 0 0', padding: 0 }}>
              {lines.map((h, i) => (
                <li
                  key={i}
                  onClick={() => onOpen(h.path)}
                  style={{ cursor: 'pointer', padding: '1px 0 1px 14px', fontFamily: 'monospace', fontSize: 11 }}
                  title={`Line ${h.line} — click to open`}
                >
                  <span className="muted">{h.line}</span> {h.text}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
