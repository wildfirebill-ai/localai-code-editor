import { useEffect, useState } from 'react';
import { useApp } from './state';

interface Node {
  name: string;
  path: string;
  isDir: boolean;
  children?: Node[];
}

async function loadTree(client: { request: <T>(m: string, p?: Record<string, unknown>) => Promise<T> }, dir: string): Promise<Node[]> {
  const entries = await client.request<string[]>('fs.list', { path: dir || '' });
  return Promise.all(
    entries.map(async (entry) => {
      const isDir = entry.endsWith('/');
      const name = entry.replace(/\/$/, '');
      const path = dir ? `${dir}/${name}` : name;
      const node: Node = { name, path, isDir };
      if (isDir) node.children = await loadTree(client, path);
      return node;
    }),
  );
}

export function Explorer({ onOpen, openPath }: { onOpen: (path: string) => void; openPath: string }) {
  const { client, workspace } = useApp();
  const [tree, setTree] = useState<Node[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /** Folder new items are created in; node targeted by rename/delete. */
  const [selectedDir, setSelectedDir] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [err, setErr] = useState('');

  const refresh = () => loadTree(client, '').then(setTree).catch((e) => setErr(String(e)));
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, workspace]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

  const toggle = (node: Node) => {
    setExpanded((e) => ({ ...e, [node.path]: !e[node.path] }));
    if (!node.children) void refresh();
  };

  const select = (node: Node) => {
    setSelectedNode(node);
    setSelectedDir(node.isDir ? node.path : parentOf(node.path));
  };

  const newFile = () =>
    void run(async () => {
      const name = prompt(`New file in ${selectedDir || 'workspace root'}:`);
      if (!name) return;
      const path = selectedDir ? `${selectedDir}/${name}` : name;
      await client.request('fs.createFile', { path });
      onOpen(path);
    });

  const newFolder = () =>
    void run(async () => {
      const name = prompt(`New folder in ${selectedDir || 'workspace root'}:`);
      if (!name) return;
      await client.request('fs.createDir', { path: selectedDir ? `${selectedDir}/${name}` : name });
    });

  const renameSel = () => {
    const n = selectedNode;
    if (!n) return;
    void run(async () => {
      const name = prompt(`Rename "${n.name}" to:`, n.name);
      if (!name || name === n.name) return;
      await client.request('fs.rename', { path: n.path, newName: name });
      if (openPath === n.path) onOpen(parentOf(n.path) ? `${parentOf(n.path)}/${name}` : name);
    });
  };

  const deleteSel = () => {
    const n = selectedNode;
    if (!n) return;
    if (!confirm(`Delete ${n.isDir ? 'folder' : 'file'} "${n.path}"?${n.isDir ? '\n(Contents will be removed too.)' : ''}`)) return;
    void run(async () => {
      await client.request('fs.delete', { path: n.path });
      if (openPath === n.path || openPath.startsWith(`${n.path}/`)) onOpen('');
    });
  };

  const renderNode = (node: Node, depth: number) => {
    const indent = { paddingLeft: `${depth * 12 + 6}px` };
    const isOpen = expanded[node.path];
    const isSelected = selectedNode?.path === node.path;
    if (node.isDir) {
      return (
        <div key={node.path}>
          <div
            className={`tree-item ${isOpen ? 'open' : ''} ${isSelected ? 'active' : ''}`}
            style={indent}
            onClick={() => toggle(node)}
            onContextMenu={(e) => {
              e.preventDefault();
              select(node);
            }}
          >
            <span className="chevron">{isOpen ? '▼' : '▶'}</span>
            <span className="icon">📁</span>
            {node.name}
          </div>
          {isOpen && node.children?.map((c) => renderNode(c, depth + 1))}
        </div>
      );
    }
    return (
      <div
        key={node.path}
        className={`tree-item file ${node.path === openPath ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
        style={indent}
        onClick={() => onOpen(node.path)}
        onContextMenu={(e) => {
          e.preventDefault();
          select(node);
        }}
      >
        <span className="icon">📄</span>
        {node.name}
      </div>
    );
  };

  return (
    <div className="explorer">
      <div className="panel-title">Explorer</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 6px', wordBreak: 'break-all' }} title={workspace}>
        {workspace || '…'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 8px 8px' }}>
        <button className="btn tiny" title="New file in the selected folder" onClick={newFile}>+ File</button>
        <button className="btn tiny" title="New folder in the selected folder" onClick={newFolder}>+ Folder</button>
        <button className="btn tiny" disabled={!selectedNode} title="Rename selection" onClick={renameSel}>Rename</button>
        <button className="btn tiny" disabled={!selectedNode} title="Delete selection" onClick={deleteSel}>Delete</button>
        <button className="btn tiny" title="Reload tree" onClick={() => void refresh()}>↻</button>
      </div>
      {err && <p className="error" style={{ padding: '0 10px' }}>{err}</p>}
      {!tree.length && <p className="muted" style={{ padding: '0 10px' }}>Empty workspace.</p>}
      {tree.map((n) => renderNode(n, 0))}
      <p className="muted" style={{ padding: '6px 10px', fontSize: 11 }}>
        Click a folder to target it for new files. Right-click to select for rename/delete.
      </p>
    </div>
  );
}
