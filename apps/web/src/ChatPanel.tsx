import { useState } from 'react';
import { useApp } from './state';

export function ChatPanel() {
  const { providers, models, activeProvider, activeModel, setActiveProvider, setActiveModel, sendPrompt, running, chat, clearChat, connected } = useApp();
  const [prompt, setPrompt] = useState('');

  const submit = () => {
    const p = prompt.trim();
    if (!p || running) return;
    setPrompt('');
    void sendPrompt(p);
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
      </div>
      <div className="chat-log">
        {chat.length === 0 && <p className="muted">Ask the agent to build, edit, run, or debug.</p>}
        {chat.map((c, i) => (
          <div key={i} className={`chat-entry ${c.role}`}>
            <div className="chat-role">{c.role}</div>
            <div className="chat-content">{c.content}</div>
          </div>
        ))}
        {running && <div className="chat-entry assistant"><span className="spinner" /> working…</div>}
      </div>
      <div className="chat-input">
        <textarea
          placeholder={connected ? 'e.g. add a README, run the tests, fix the bug' : 'Connecting to server…'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          disabled={!connected || running}
        />
        <div className="row">
          <button className="btn primary" onClick={submit} disabled={!connected || running}>
            {running ? 'Running…' : 'Run'}
          </button>
          <button className="btn subtle" onClick={clearChat}>Clear</button>
        </div>
      </div>
    </div>
  );
}