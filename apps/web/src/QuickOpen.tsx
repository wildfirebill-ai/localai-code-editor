import { useEffect, useRef, useState } from 'react';
import { useApp } from './state';
import { getAllFiles, fuzzyFilter } from './files';

/** Ctrl+P fuzzy file finder. */
export function QuickOpen({ onOpen, onClose }: { onOpen: (path: string) => void; onClose: () => void }) {
  const { client, workspace } = useApp();
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getAllFiles(client, workspace).then(setFiles).catch(() => setFiles([]));
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [client, workspace]);

  const results = fuzzyFilter(files, query);

  const pick = (path?: string) => {
    const target = path ?? results[sel];
    if (target) onOpen(target);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: 520, maxWidth: '90vw' }} className="quick-open">
        <input
          ref={inputRef}
          value={query}
          placeholder="Go to file… (type to search)"
          onChange={(e) => {
            setQuery(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') pick();
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
          }}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
          {results.length === 0 && <li className="muted" style={{ padding: '8px 10px' }}>No matching files.</li>}
          {results.map((f, i) => (
            <li
              key={f}
              onMouseEnter={() => setSel(i)}
              onClick={() => pick(f)}
              className="quick-open-item"
              style={{
                padding: '4px 10px', cursor: 'pointer',
                background: i === sel ? 'var(--accent, #2b6cb0)' : 'transparent',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {f}
            </li>
          ))}
        </ul>
        <div className="muted" style={{ padding: '4px 10px', fontSize: 11 }}>
          ↑↓ navigate · Enter open · Esc close
        </div>
      </div>
    </div>
  );
}
