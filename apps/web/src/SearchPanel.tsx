import { useState, useRef, useEffect } from 'react';
import { useApp } from './state';
import { searchFiles, type SearchResult } from './search';

interface SearchPanelProps {
  onOpen: (path: string) => void;
}

export function SearchPanel({ onOpen }: SearchPanelProps) {
  const { client, workspace } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        setSearching(true);
        searchFiles(client, workspace, { query })
          .then(setResults)
          .catch(() => setResults([]))
          .finally(() => setSearching(false));
      } else {
        setResults([]);
      }
    }, 300);
  }, [query, client, workspace]);

  const highlightMatch = (content: string, idx: number, len: number) => {
    if (idx < 0) return content;
    return (
      <>
        {content.slice(0, idx)}
        <span style={{ background: 'var(--yellow)', color: 'var(--bg)', padding: '0 2px', borderRadius: 2 }}>
          {content.slice(idx, idx + len)}
        </span>
        {content.slice(idx + len)}
      </>
    );
  };

  return (
    <div className="search-panel">
      <div className="panel-title">Search</div>
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search across files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {searching && <span className="spinner" />}
      </div>
      <div className="search-results">
        {results.length === 0 && query && !searching && (
          <p className="muted" style={{ padding: '8px 10px' }}>No results found</p>
        )}
        {results.map((r, i) => (
          <div
            key={`${r.path}:${r.line}:${i}`}
            className="search-result"
            onClick={() => onOpen(r.path)}
          >
            <div className="search-result-path">{r.path}:{r.line}</div>
            <div className="search-result-content">
              {highlightMatch(r.content, r.matchStart, r.matchEnd - r.matchStart)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}