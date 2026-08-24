/**
 * Status bar component - shows editor state at the bottom of the screen.
 */

import { useApp } from './state';

export function StatusBar() {
  const { workspace, activeProvider, activeModel, running, settings } = useApp();
  
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item" title="Current workspace">
          📁 {workspace || 'No workspace'}
        </span>
        <span className="status-item">|</span>
        <span className="status-item" title="Active LLM provider">
          ⚙ {activeProvider || 'No provider'}
        </span>
        <span className="status-item" title="Active model">
          🤖 {activeModel || 'No model'}
        </span>
      </div>
      <div className="status-right">
        {running && (
          <span className="status-item running">
            ⚡ Agent running
          </span>
        )}
        <span className="status-item">
          {settings.fontSize}px
        </span>
        <span className="status-item">
          {settings.wordWrap === 'on' ? 'Wrapped' : 'No Wrap'}
        </span>
      </div>
    </div>
  );
}