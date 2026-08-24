import { useState, useEffect } from 'react';
import { useApp } from './state';
import type { TaskEntry } from './task_history';

export function TaskHistory() {
  const { client } = useApp();
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [selected, setSelected] = useState<TaskEntry | null>(null);

  const loadHistory = async () => {
    try {
      const result = await client.request<{ tasks: TaskEntry[] }>('agent.history');
      setTasks(result.tasks);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const loadTask = async (id: string) => {
    try {
      const result = await client.request<{ task: TaskEntry }>('agent.getTask', { id });
      setSelected(result.task);
    } catch (e) {
      console.error('Failed to load task:', e);
    }
  };

  useEffect(() => { void loadHistory(); }, [client]);

  const statusColor = (s: string) => s === 'completed' ? 'ok' : s === 'cancelled' ? 'bad' : 'muted';

  return (
    <div className="task-history">
      <div className="panel-title">
        Task History
        <button className="btn tiny" style={{ marginLeft: 8 }} onClick={loadHistory}>↻</button>
      </div>

      {tasks.length === 0 && (
        <p className="muted" style={{ padding: '0 10px' }}>
          No agent runs recorded yet. Run a prompt to start building history.
        </p>
      )}

      <ul className="changes">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="change"
            style={{ cursor: 'pointer', padding: '4px 10px' }}
            onClick={() => void loadTask(t.id)}
          >
            <span className={`dot ${statusColor(t.status)}`} />
            <span className="change-path" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.prompt.slice(0, 60)}
            </span>
            <span className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
              {t.toolsCalled.length} tools · {new Date(t.timestamp).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="task-detail" style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>Task Detail</strong>
            <button className="btn tiny" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            <div><strong>Provider:</strong> {selected.provider} · <strong>Model:</strong> {selected.model}</div>
            <div><strong>Tools:</strong> {selected.toolsCalled.join(', ') || 'none'}</div>
            <div><strong>Files:</strong> {selected.filesChanged.join(', ') || 'none'}</div>
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <strong>Messages ({selected.messages.length}):</strong>
            </div>
            <ul style={{ margin: '4px 0', padding: '0 0 0 16px' }}>
              {selected.messages.slice(0, 20).map((m, i) => (
                <li key={i} style={{ marginBottom: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <span style={{ color: m.role === 'assistant' ? 'var(--accent)' : m.role === 'tool' ? 'var(--yellow)' : 'var(--fg-muted)' }}>
                    {m.role}:
                  </span>{' '}
                  <span style={{ color: m.success === false ? 'var(--red)' : undefined }}>
                    {m.content.slice(0, 200)}
                    {m.content.length > 200 ? '…' : ''}
                  </span>
                  {m.toolName && <span className="muted"> ({m.toolName})</span>}
                </li>
              ))}
            </ul>
            {selected.messages.length > 20 && (
              <div className="muted">… {selected.messages.length - 20} more messages</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}