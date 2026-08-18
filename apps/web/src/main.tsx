import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startLanguageServers } from './lsp';
import './styles.css';

// Share the npm monaco instance with @monaco-editor/react so that our
// language-server providers (registered against the same instance) apply to
// the editors it creates.
loader.config({ monaco });

// Worker setup so features (incl. basic TS/JS diagnostics) work offline.
self.MonacoEnvironment = {
  getWorker: (_moduleId: string, label: string) => {
    switch (label) {
      case 'json': return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url), { type: 'module' });
      case 'css': return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url), { type: 'module' });
      case 'html': return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url), { type: 'module' });
      case 'typescript':
      case 'javascript': return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url), { type: 'module' });
      default: return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' });
    }
  },
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Kick off language-server connections once the app mounts.
startLanguageServers();