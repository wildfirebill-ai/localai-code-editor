import { useState } from 'react';
import { useApp } from './state';
import type { FileChange } from './file-changes';

interface ChangesPanelProps {
  onOpen: (path: string) => void;
}

export function ChangesPanel({ onOpen }: ChangesPanelProps) {
  const { client } = useApp();
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const result = await client.request<{ changes: FileChange[] }>('agent.fileChanges');
      setChanges(result.changes || []);
    } catch (e) {
      console.error('Failed to load changes:', e);
    }
    setLoading(false);
  };

  const clearChanges = async () => {
    try {
      await client.request('agent.clearFileChanges');
      setChanges([]);
    } catch (e) {
      console.error('Failed to clear changes:', e);
    }
  };

  const grouped = changes.reduce<Record<string, FileChange[]>>((acc, change) => {
    acc[change.type] = acc[change.type] || [];
    acc[change.type].push(change);
    return acc;
  }, {});

  const typeColors: Record<string, string> = {
    created: 'var(--green)',
    modified: 'var(--yellow)',
    deleted: 'var(--red)',
    unchanged: 'var(--fg-muted)',
  };

  const typeLabels: Record<string, string> = {
    created: 'Created',
    modified: 'Modified',
    deleted: 'Deleted',
    unchanged: 'Unchanged',
  };

  return (
    <div className="changes-panel">
      <div className="panel-title">
        Changes
        <button className="btn tiny" style={{ marginLeft: 8 }} onClick={loadChanges}>↻</button>
        {changes.length > 0 && (
          <button className="btn tiny" style={{ marginLeft: 4 }} onClick={clearChanges}>Clear</button>
        )}
      </div>

      {changes.length === 0 && !loading && (
        <p className="muted" style={{ padding: '0 10px' }}>
          No file changes tracked. Run the agent to start tracking modifications.
        </p>
      )}

      {Object.entries(grouped).map(([type, fileChanges]) => (
        <div key={type} className="change-group">
          <div className="change-group-header">
            <span className="change-dot" style={{ backgroundColor: typeColors[type] }} />
            <span className="change-label">{typeLabels[type]} ({fileChanges.length})</span>
          </div>
          <ul className="change-list">
            {fileChanges.map((change, i) => (
              <li key={`${change.path}-${i}`} className="change-item" onClick={() => onOpen(change.path)}>
                <span className="change-path">{change.path}</span>
                <span className="change-time">
                  {new Date(change.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}