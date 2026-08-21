import { useEffect, useRef, useState } from 'react';
import { useApp } from './state';
import { invalidateFileCache } from './files';

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

type Pending =
  | { mode: 'file' | 'folder'; parent: string }
  | { mode: 'rename'; path: string; initial: string };

export function Explorer({ onOpen, openPath }: { onOpen: (path: string) => void; openPath: string }) {
  const { client, workspace } = useApp();
  const [tree, setTree] = useState<Node[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /** Folder new items are created in; node targeted by rename/delete. */
  const [selectedDir, setSelectedDir] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [err, setErr] = useState('');
  /** Inline create/rename input (window.prompt is unsupported in Electron). */
  const [pending, setPending] = useState<Pending | null>(null);
  const [pendingName, setPendingName] = useState('');
  const pendingRef = useRef<HTMLInputElement>(null);

  const refresh = () => loadTree(client, '').then(setTree).catch((e) => setErr(String(e)));
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, workspace]);

  useEffect(() => {
    if (pending) {
      setPendingName(pending.mode === 'rename' ? pending.initial : '');
      // Focus after the input mounts.
      requestAnimationFrame(() => pendingRef.current?.focus());
    }
  }, [pending]);

  // Keep the tree expanded to the file open in the editor.
  useEffect(() => {
    if (!openPath) return;
    const parts = openPath.split('/');
    setExpanded((e) => {
      const next = { ...e };
      let acc = '';
      for (let i = 0; i < parts.length - 1; i++) {
        acc = acc ? `${acc}/${parts[i]}` : parts[i];
        next[acc] = true;
      }
      return next;
    });
  }, [openPath]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try {
      await fn();
      invalidateFileCache();
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

  const startCreate = (mode: 'file' | 'folder') => {
    setSelectedDir(selectedNode ? (selectedNode.isDir ? selectedNode.path : parentOf(selectedNode.path)) : selectedDir);
    setPending({ mode, parent: selectedDir });
  };

  const startRename = () => {
    if (!selectedNode) return;
    setPending({ mode: 'rename', path: selectedNode.path, initial: selectedNode.name });
  };

  const commitPending = () => {
    const p = pending;
    const name = pendingName.trim();
    if (!p || !name) return setPending(null);
    setPending(null);
    if (p.mode === 'rename') {
      if (name === p.initial) return;
      void run(async () => {
        await client.request('fs.rename', { path: p.path, newName: name });
        const parent = parentOf(p.path);
        if (openPath === p.path || openPath.startsWith(`${p.path}/`)) {
          onOpen(parent ? `${parent}/${name}` : name);
        }
      });
    } else {
      const path = p.parent ? `${p.parent}/${name}` : name;
      void run(async () => {
        if (p.mode === 'file') {
          await client.request('fs.createFile', { path });
          onOpen(path);
        } else {
          await client.request('fs.createDir', { path });
          if (p.parent) setExpanded((e) => ({ ...e, [p.parent]: true }));
        }
      });
    }
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

  const pendingLabel =
    pending?.mode === 'file'
      ? `New file in ${pending.parent || 'workspace root'}`
      : pending?.mode === 'folder'
        ? `New folder in ${pending.parent || 'workspace root'}`
        : 'Rename';

  return (
    <div className="explorer">
      <div className="panel-title">Explorer</div>
      <p className="muted" style={{ padding: '0 10px', margin: '0 0 6px', wordBreak: 'break-all' }} title={workspace}>
        {workspace || '…'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 8px 8px' }}>
        <button className="btn tiny" title="New file in the selected folder" onClick={() => startCreate('file')}>+ File</button>
        <button className="btn tiny" title="New folder in the selected folder" onClick={() => startCreate('folder')}>+ Folder</button>
        <button className="btn tiny" disabled={!selectedNode} title="Rename selection" onClick={startRename}>Rename</button>
        <button className="btn tiny" disabled={!selectedNode} title="Delete selection" onClick={deleteSel}>Delete</button>
        <button className="btn tiny" title="Reload tree" onClick={() => void refresh()}>↻</button>
      </div>
      {pending && (
        <div style={{ padding: '0 8px 8px' }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>{pendingLabel}</div>
          <input
            ref={pendingRef}
            value={pendingName}
            placeholder="name"
            onChange={(e) => setPendingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitPending();
              if (e.key === 'Escape') setPending(null);
            }}
            onBlur={() => setPending(null)}
            style={{ width: '100%' }}
          />
        </div>
      )}
      {err && <p className="error" style={{ padding: '0 10px' }}>{err}</p>}
      {!tree.length && !pending && <p className="muted" style={{ padding: '0 10px' }}>Empty workspace.</p>}
      {tree.map((n) => renderNode(n, 0))}
      <p className="muted" style={{ padding: '6px 10px', fontSize: 11 }}>
        Click a folder to target it for new files. Right-click to select for rename/delete.
      </p>
    </div>
  );
}
