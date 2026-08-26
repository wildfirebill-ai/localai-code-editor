import { useState, useRef, useEffect } from 'react';
import { useApp } from './state';

interface FindResult {
  line: number;
  col: number;
  text: string;
}

export function FindReplace({ filePath, content }: { filePath: string; content: string }) {
  const { client } = useApp();
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<FindResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const lines = content.split('\n');
    const found: FindResult[] = [];
    let pattern: RegExp;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundary = wholeWord ? `\\b${escaped}\\b` : escaped;
      pattern = new RegExp(wordBoundary, flags);
    } catch {
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lines[i])) !== null) {
        found.push({ line: i + 1, col: match.index + 1, text: match[0] });
        if (match[0].length === 0) break;
      }
    }
    setResults(found);
    setSelectedIdx(found.length > 0 ? 0 : -1);
  }, [query, content, useRegex, caseSensitive, wholeWord]);

  const replaceOne = async () => {
    if (selectedIdx < 0 || !results[selectedIdx]) return;
    const lines = content.split('\n');
    const r = results[selectedIdx];
    const line = lines[r.line - 1];
    let pattern: RegExp;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, flags);
    } catch { return; }
    lines[r.line - 1] = line.replace(pattern, replacement);
    await client.request('fs.write', { path: filePath, content: lines.join('\n') });
    // Re-trigger search via parent
  };

  const replaceAll = async () => {
    if (!query || results.length === 0) return;
    let pattern: RegExp;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, flags);
    } catch { return; }
    const newContent = content.replace(pattern, replacement);
    await client.request('fs.write', { path: filePath, content: newContent });
    setResults([]);
  };

  return (
    <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          ref={inputRef}
          placeholder="Find"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }}
        />
        <label title="Regex" style={{ fontSize: 11, cursor: 'pointer', color: useRegex ? 'var(--blue)' : 'var(--fg-muted)' }}>
          <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} style={{ display: 'none' }} />
          .*
        </label>
        <label title="Case sensitive" style={{ fontSize: 11, cursor: 'pointer', color: caseSensitive ? 'var(--blue)' : 'var(--fg-muted)' }}>
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} style={{ display: 'none' }} />
          Aa
        </label>
        <label title="Whole word" style={{ fontSize: 11, cursor: 'pointer', color: wholeWord ? 'var(--blue)' : 'var(--fg-muted)' }}>
          <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} style={{ display: 'none' }} />
          Ab
        </label>
        <span className="muted" style={{ fontSize: 10 }}>{results.length} found</span>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          placeholder="Replace"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }}
        />
        <button className="btn tiny" disabled={results.length === 0} onClick={replaceOne}>Replace</button>
        <button className="btn tiny" disabled={results.length === 0} onClick={replaceAll}>All</button>
      </div>
    </div>
  );
}
