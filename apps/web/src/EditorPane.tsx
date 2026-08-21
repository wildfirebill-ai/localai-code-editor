import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useApp } from './state';
import { languageForFile, openInLanguageServer, changedInLanguageServer } from './lsp';

export function EditorPane({ path }: { path: string }) {
  const { client, editorReloadKey: reloadKey } = useApp();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const uriRef = useRef<string | null>(null);
  /** Latest dirty state for effects that must not clobber user edits. */
  const dirtyRef = useRef(false);
  const dirty = loaded && content !== savedContent;
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!path) {
      setLoaded(false);
      return;
    }
    // Agent just finished and edited this file — don't clobber unsaved work.
    if (reloadKey > 0 && dirtyRef.current) return;
    let cancelled = false;
    setLoaded(false);
    client
      .request<string>('fs.read', { path })
      .then(async (c) => {
        if (cancelled) return;
        setContent(c);
        setSavedContent(c);
        setLoaded(true);
        // The Monaco model for this path resolves to a `file://`-like uri;
        // derive it and open it in the matching language server.
        const uri = `file:///${path.split('/').map(encodeURIComponent).join('/')}`;
        uriRef.current = uri;
        await openInLanguageServer(path, uri, c);
      })
      .catch(() => {
        if (!cancelled) {
          setContent('');
          setSavedContent('');
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, client, reloadKey]);

  const save = async () => {
    if (!path) return;
    await client.request('fs.write', { path, content });
    setSavedContent(content);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => void save());
  };

  const language = path ? (languageForFile(path) ?? guessLanguage(path)) : undefined;

  return (
    <div className="editor-pane">
      {path && (
        <div className="editor-tab">
          <span>
            {path}
            {dirty && <span title="Unsaved changes" style={{ color: '#e5c07b', marginLeft: 6 }}>●</span>}
          </span>
          <span className="muted">{language}</span>
          <button className={`btn tiny ${dirty ? 'primary' : ''}`} onClick={() => void save()}>
            Save (Ctrl+S)
          </button>
        </div>
      )}
      {!path && <div className="placeholder">Select a file to edit.</div>}
      {path && loaded && (
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={(v) => {
            const next = v ?? '';
            setContent(next);
            if (uriRef.current) void changedInLanguageServer(uriRef.current, next);
          }}
          onMount={handleMount}
          path={path}
        />
      )}
    </div>
  );
}

function guessLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown', py: 'python', rb: 'ruby', go: 'go',
    rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', h: 'cpp', cs: 'csharp',
    html: 'html', css: 'css', scss: 'scss', yml: 'yaml', yaml: 'yaml',
    sql: 'sql', sh: 'shell', bash: 'shell', ps1: 'powershell', dockerfile: 'dockerfile',
    toml: 'ini', ini: 'ini', xml: 'xml', svg: 'xml',
  };
  return map[ext] ?? 'plaintext';
}
