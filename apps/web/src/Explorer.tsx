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
  const { client } = useApp();
  const [tree, setTree] = useState<Node[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refresh = () => loadTree(client, '').then(setTree);
  useEffect(() => {
    void refresh();
  }, [client]);

  const toggle = (node: Node) => {
    setExpanded((e) => ({ ...e, [node.path]: !e[node.path] }));
    if (!node.children) void refresh();
  };

  const renderNode = (node: Node, depth: number) => {
    const indent = { paddingLeft: `${depth * 12 + 6}px` };
    const isOpen = expanded[node.path];
    if (node.isDir) {
      return (
        <div key={node.path}>
          <div className={`tree-item ${isOpen ? 'open' : ''}`} style={indent} onClick={() => toggle(node)}>
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
        className={`tree-item file ${node.path === openPath ? 'active' : ''}`}
        style={indent}
        onClick={() => onOpen(node.path)}
      >
        <span className="icon">📄</span>
        {node.name}
      </div>
    );
  };

  return (
    <div className="explorer">
      <div className="panel-title">Explorer</div>
      <button className="btn subtle" onClick={() => void refresh()}>
        ↻ Refresh
      </button>
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}