import { useEffect, useRef, useState } from 'react';
import { useApp } from './state';
import { getAllFiles, fuzzyFilter } from './files';

interface MentionState {
  active: boolean;
  query: string;
  start: number;
  options: string[];
  sel: number;
}

const EMPTY_MENTION: MentionState = { active: false, query: '', start: -1, options: [], sel: 0 };

export function ChatPanel() {
  const {
    providers, models, activeProvider, activeModel, setActiveProvider, setActiveModel,
    sendPrompt, stop, running, chat, clearChat, connected, client, workspace,
  } = useApp();
  const [prompt, setPrompt] = useState('');
  const [mention, setMention] = useState<MentionState>(EMPTY_MENTION);
  const [showParams, setShowParams] = useState(false);
  const [temperature, setTemperature] = useState(() => localStorage.getItem('localai.temperature') ?? '');
  const [maxTokens, setMaxTokens] = useState(() => localStorage.getItem('localai.maxTokens') ?? '');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('localai.temperature', temperature);
  }, [temperature]);
  useEffect(() => {
    localStorage.setItem('localai.maxTokens', maxTokens);
  }, [maxTokens]);

  /** Detect an @mention being typed before the caret. */
  const detectMention = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = before.match(/(^|\s)@([\w./-]*)$/);
    if (!m) return setMention(EMPTY_MENTION);
    const query = m[2];
    void getAllFiles(client, workspace).then((files) => {
      const options = fuzzyFilter(files, query, 8);
      setMention({ active: true, query, start: caret - query.length, options, sel: 0 });
    });
  };

  const completeMention = (path: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? prompt.length;
    const next = prompt.slice(0, mention.start) + path + ' ' + prompt.slice(caret);
    setPrompt(next);
    setMention(EMPTY_MENTION);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = mention.start + path.length + 1;
      ta.setSelectionRange(pos, pos);
    });
  };

  const onTaChange = (text: string) => {
    setPrompt(text);
    const ta = taRef.current;
    if (ta) detectMention(text, ta.selectionStart ?? text.length);
  };

  const submit = async () => {
    if (mention.active && mention.options.length) return completeMention(mention.options[mention.sel]);
    const p = prompt.trim();
    if (!p || running) return;
    setPrompt('');
    setMention(EMPTY_MENTION);

    // Resolve @file mentions into attached context blocks.
    let finalPrompt = p;
    const mentioned = [...p.matchAll(/@([\w./-]+)/g)].map((m) => m[1]);
    const unique = [...new Set(mentioned)].slice(0, 5);
    if (unique.length) {
      const blocks: string[] = [];
      for (const name of unique) {
        try {
          const content = await client.request<string>('fs.read', { path: name });
          blocks.push(`[Attached file: ${name}]\n${content.slice(0, 8000)}${content.length > 8000 ? '\n…(truncated)' : ''}`);
        } catch {
          /* not a real file — leave the mention as plain text */
        }
      }
      if (blocks.length) finalPrompt = `${blocks.join('\n\n')}\n\n${p}`;
    }

    const params: { temperature?: number; maxTokens?: number } = {};
    const t = parseFloat(temperature);
    const mt = parseInt(maxTokens, 10);
    if (!Number.isNaN(t)) params.temperature = t;
    if (!Number.isNaN(mt) && mt > 0) params.maxTokens = mt;

    await sendPrompt(finalPrompt, params);
  };

  const onTaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention.active && mention.options.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMention((m) => ({ ...m, sel: Math.min(m.sel + 1, m.options.length - 1) })); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMention((m) => ({ ...m, sel: Math.max(m.sel - 1, 0) })); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); completeMention(mention.options[mention.sel]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMention(EMPTY_MENTION); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-title">Agent</div>
      <div className="provider-row">
        <select value={activeProvider} onChange={(e) => setActiveProvider(e.target.value)}>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)}>
          {models.length === 0 && <option value="">No models</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name ?? m.id}</option>
          ))}
        </select>
        <button className="btn tiny" title="Sampling parameters" onClick={() => setShowParams((v) => !v)}>
          ⚙
        </button>
      </div>
      {showParams && (
        <div className="row" style={{ gap: 6, padding: '4px 10px', alignItems: 'center' }}>
          <label className="muted" style={{ fontSize: 11 }}>temp</label>
          <input
            type="number" min={0} max={2} step={0.1} placeholder="default"
            value={temperature} onChange={(e) => setTemperature(e.target.value)}
            style={{ width: 70 }}
          />
          <label className="muted" style={{ fontSize: 11 }}>max tokens</label>
          <input
            type="number" min={1} step={128} placeholder="default"
            value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)}
            style={{ width: 80 }}
          />
        </div>
      )}
      <div className="chat-log">
        {chat.length === 0 && (
          <p className="muted">
            Ask the agent to build, edit, run, or debug. Type <code>@</code> to attach a file.
          </p>
        )}
        {chat.map((c, i) => (
          <div key={i} className={`chat-entry ${c.role}`}>
            <div className="chat-role">{c.role}</div>
            <div className="chat-content">{c.content}</div>
          </div>
        ))}
        {running && <div className="chat-entry assistant"><span className="spinner" /> working…</div>}
      </div>
      <div className="chat-input" style={{ position: 'relative' }}>
        {mention.active && mention.options.length > 0 && (
          <ul
            style={{
              position: 'absolute', bottom: '100%', left: 10, right: 10, zIndex: 20,
              listStyle: 'none', margin: 0, padding: 0, maxHeight: 180, overflowY: 'auto',
              background: 'var(--bg-elev, #21252b)', border: '1px solid #3a3f4b',
            }}
          >
            {mention.options.map((f, i) => (
              <li
                key={f}
                onMouseEnter={() => setMention((m) => ({ ...m, sel: i }))}
                onClick={() => completeMention(f)}
                style={{
                  padding: '3px 8px', cursor: 'pointer', fontSize: 12,
                  background: i === mention.sel ? 'var(--accent, #2b6cb0)' : 'transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                @{f}
              </li>
            ))}
          </ul>
        )}
        <textarea
          ref={taRef}
          placeholder={connected ? 'e.g. add a README, run the tests, fix the bug — @file to attach' : 'Connecting to server…'}
          value={prompt}
          onChange={(e) => onTaChange(e.target.value)}
          onKeyDown={onTaKeyDown}
          rows={2}
          disabled={!connected || running}
        />
        <div className="row">
          <button className="btn primary" onClick={() => void submit()} disabled={!connected || running}>
            {running ? 'Running…' : 'Run'}
          </button>
          {running && (
            <button className="btn subtle" title="Cancel the agent run" onClick={stop}>
              ■ Stop
            </button>
          )}
          <button className="btn subtle" onClick={clearChat}>Clear</button>
        </div>
      </div>
    </div>
  );
}
