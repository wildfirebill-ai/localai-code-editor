import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './state';
import { Explorer } from './Explorer';
import { GitPanel } from './GitPanel';
import { ChatPanel } from './ChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { SkillsPanel } from './SkillsPanel';
import { SearchPanel } from './SearchPanel';
import { TaskHistory } from './TaskHistory';
import { QuickOpen } from './QuickOpen';
import { EditorPane } from './EditorPane';
import { StatusBar } from './StatusBar';
import { ChangesPanel } from './ChangesPanel';

type SideTab = 'explorer' | 'search' | 'git' | 'skills' | 'mcp' | 'history' | 'changes';
type Panel = 'editor' | 'chat';

function Workspace() {
  const { connected, status, workspace } = useApp();
  const [side, setSide] = useState<SideTab>('explorer');
  const [panel, setPanel] = useState<Panel>('editor');
  const [openPath, setOpenPath] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);

  // Ctrl+P / Cmd+P opens the fuzzy file finder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          <button title="Search" className={`icon-btn ${side === 'search' ? 'active' : ''}`} onClick={() => setSide('search')}>🔍</button>
          <button title="Source Control" className={`icon-btn ${side === 'git' ? 'active' : ''}`} onClick={() => setSide('git')}>
            📋
            {status && status.isRepo && status.changes.length > 0 && <span className="badge">{status.changes.length}</span>}
          </button>
          <button title="MCP Servers" className={`icon-btn ${side === 'mcp' ? 'active' : ''}`} onClick={() => setSide('mcp')}>⚡</button>
          <button title="Agent Skills" className={`icon-btn ${side === 'skills' ? 'active' : ''}`} onClick={() => setSide('skills')}>🧠</button>
          <button title="Task History" className={`icon-btn ${side === 'history' ? 'active' : ''}`} onClick={() => setSide('history')}>📜</button>
          <button title="File Changes" className={`icon-btn ${side === 'changes' ? 'active' : ''}`} onClick={() => setSide('changes')}>📝</button>
          <div className="spacer" />
          <button title="Quick Open (Ctrl+P)" className="icon-btn" onClick={() => setQuickOpen(true)}>⌘</button>
          <button title="Agent panel" className={`icon-btn ${panel === 'chat' ? 'active' : ''}`} onClick={() => setPanel(panel === 'chat' ? 'editor' : 'chat')}>✨</button>
        </nav>

        <aside className="sidebar">
          {side === 'explorer' && <Explorer onOpen={setOpenPath} openPath={openPath} />}
          {side === 'search' && <SearchPanel onOpen={setOpenPath} />}
          {side === 'git' && <GitPanel onOpenDiff={setOpenPath} />}
          {side === 'mcp' && <SettingsPanel />}
          {side === 'skills' && <SkillsPanel />}
          {side === 'history' && <TaskHistory />}
          {side === 'changes' && <ChangesPanel onOpen={setOpenPath} />}
        </aside>

        <main className={`main ${panel === 'chat' ? 'with-chat' : ''}`}>
          <div className="editor-container">
            <EditorPane path={openPath} />
          </div>
          {panel === 'chat' && <ChatPanel />}
        </main>
      </div>
      {quickOpen && (
        <QuickOpen
          onOpen={setOpenPath}
          onClose={() => setQuickOpen(false)}
          key={workspace}
        />
      )}
      <StatusBar />
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
