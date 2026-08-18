import { useState } from 'react';
import { AppProvider, useApp } from './state';
import { Explorer } from './Explorer';
import { GitPanel } from './GitPanel';
import { ChatPanel } from './ChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { SkillsPanel } from './SkillsPanel';
import { EditorPane } from './EditorPane';

type SideTab = 'explorer' | 'git' | 'skills' | 'mcp';
type Panel = 'editor' | 'chat';

function Workspace() {
  const { connected, status } = useApp();
  const [side, setSide] = useState<SideTab>('explorer');
  const [panel, setPanel] = useState<Panel>('editor');
  const [openPath, setOpenPath] = useState('');

  return (
    <div className="app">
      <header className="titlebar">
        <span className="logo">⚙ LocalAI Code Editor</span>
        <span className={`conn ${connected ? 'ok' : 'bad'}`}>{connected ? 'connected' : 'offline'}</span>
        {!connected && <button className="btn subtle" onClick={() => location.reload()}>Reconnect</button>}
      </header>
      <div className="layout">
        <nav className="activity">
          <button title="Explorer" className={`icon-btn ${side === 'explorer' ? 'active' : ''}`} onClick={() => setSide('explorer')}>📁</button>
          <button title="Source Control" className={`icon-btn ${side === 'git' ? 'active' : ''}`} onClick={() => setSide('git')}>
            📋
            {status && status.isRepo && status.changes.length > 0 && <span className="badge">{status.changes.length}</span>}
          </button>
          <button title="MCP Servers" className={`icon-btn ${side === 'mcp' ? 'active' : ''}`} onClick={() => setSide('mcp')}>⚡</button>
          <button title="Agent Skills" className={`icon-btn ${side === 'skills' ? 'active' : ''}`} onClick={() => setSide('skills')}>🧠</button>
          <div className="spacer" />
          <button title="Agent panel" className={`icon-btn ${panel === 'chat' ? 'active' : ''}`} onClick={() => setPanel(panel === 'chat' ? 'editor' : 'chat')}>✨</button>
        </nav>

        <aside className="sidebar">
          {side === 'explorer' && <Explorer onOpen={setOpenPath} openPath={openPath} />}
          {side === 'git' && <GitPanel onOpenDiff={setOpenPath} />}
          {side === 'mcp' && <SettingsPanel />}
          {side === 'skills' && <SkillsPanel />}
        </aside>

        <main className={`main ${panel === 'chat' ? 'with-chat' : ''}`}>
          <div className="editor-container">
            <EditorPane path={openPath} />
          </div>
          {panel === 'chat' && <ChatPanel />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Workspace />
    </AppProvider>
  );
}