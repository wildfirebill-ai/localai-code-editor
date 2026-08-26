import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useApp } from './state';
import { languageForFile, openInLanguageServer, changedInLanguageServer } from './lsp';

const BINARY_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'bmp', 'pdf', 'zip', 'gz', 'tar',
  '7z', 'rar', 'exe', 'dll', 'so', 'dylib', 'bin', 'woff', 'woff2', 'ttf',
  'otf', 'eot', 'mp3', 'mp4', 'webm', 'wav', 'wasm', 'class', 'jar', 'pyc',
  'o', 'a', 'lib', 'sqlite', 'db',
]);

export function EditorPane({ path }: { path: string }) {
  const { client, editorReloadKey: reloadKey } = useApp();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [binary, setBinary] = useState(false);
  const [size, setSize] = useState(0);
  const [encoding, setEncoding] = useState('utf-8');
  const [preview, setPreview] = useState(false);
  const uriRef = useRef<string | null>(null);
  /** Latest dirty state for effects that must not clobber user edits. */
  const dirtyRef = useRef(false);
  const dirty = loaded && !binary && content !== savedContent;
  dirtyRef.current = dirty;

  useEffect(() => {
    setPreview(false);
    if (!path) {
      setLoaded(false);
      setBinary(false);
      return;
    }
    // Agent just finished and edited this file — don't clobber unsaved work.
    if (reloadKey > 0 && dirtyRef.current) return;
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    if (BINARY_EXTS.has(ext)) {
      setBinary(true);
      setLoaded(true);
      void client
        .request<{ exists: boolean; size?: number }>('fs.stat', { path })
        .then((s) => setSize(s.size ?? 0))
        .catch(() => setSize(0));
      return;
    }
    let cancelled = false;
    setLoaded(false);
    setBinary(false);
    client
      .request<{ content: string; encoding: string } | string>('fs.read', { path })
      .then(async (result) => {
        if (cancelled) return;
        const c = typeof result === 'string' ? result : result.content;
        const enc = typeof result === 'string' ? 'utf-8' : (result.encoding ?? 'utf-8');
        if (c.includes('\u0000')) {
          setBinary(true);
          setLoaded(true);
          return;
        }
        setContent(c);
        setSavedContent(c);
        setEncoding(enc);
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
    if (!path || binary) return;
    await client.request('fs.write', { path, content });
    setSavedContent(content);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => void save());

    // Bracket matching & auto-close
    editor.updateOptions({
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoSurround: 'languageDefined',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
    });

    // Multi-cursor: Ctrl+D selects next occurrence, Alt+Click adds cursor
    editor.updateOptions({
      multiCursorModifier: 'ctrlCmd',
    });

    // Code folding
    editor.updateOptions({
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      foldingHighlight: true,
    });

    // Breadcrumbs — enabled by default in Monaco; configure via editor options if needed
  };

  const language = path ? (languageForFile(path) ?? guessLanguage(path)) : undefined;
  const isMarkdown = language === 'markdown';

  return (
    <div className="editor-pane">
      {path && (
        <div className="editor-tab">
          <span>
            {path}
            {dirty && <span title="Unsaved changes" style={{ color: '#e5c07b', marginLeft: 6 }}>●</span>}
          </span>
          <span className="muted">{language} · {encoding}</span>
          {isMarkdown && (
            <button className={`btn tiny ${preview ? '' : 'subtle'}`} onClick={() => setPreview((p) => !p)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
          )}
          {!binary && (
            <button className={`btn tiny ${dirty ? 'primary' : ''}`} onClick={() => void save()}>
              Save (Ctrl+S)
            </button>
          )}
        </div>
      )}
      {!path && <div className="placeholder">Select a file to edit.</div>}
      {path && binary && (
        <div className="placeholder">
          <p>⚙ Binary file{size ? ` — ${(size / 1024).toFixed(1)} KB` : ''}</p>
          <p className="muted">This file can't be displayed as text.</p>
        </div>
      )}
      {path && loaded && !binary && isMarkdown && preview && (
        <div className="md-preview" dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
      )}
      {path && loaded && !binary && !(isMarkdown && preview) && (
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Tiny zero-dependency Markdown → HTML for the preview pane. */
function mdToHtml(md: string): string {
  const lines = escapeHtml(md).split('\n');
  const out: string[] = [];
  let inCode = false;
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const inline = (s: string): string =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      closeList();
      out.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(line);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      closeList();
      out.push('<hr/>');
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) out.push('</code></pre>');
  closeList();
  return out.join('\n');
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
