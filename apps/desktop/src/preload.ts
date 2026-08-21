import { contextBridge, ipcRenderer } from 'electron';

/**
 * Minimal, explicitly-allowlisted bridge. The renderer can ask the main
 * process to show a native folder picker and read the active workspace.
 */
contextBridge.exposeInMainWorld('localai', {
  /** Open a native directory picker. Resolves to an absolute path or null. */
  pickWorkspace: (): Promise<string | null> => ipcRenderer.invoke('pick-workspace'),
  /** The workspace the backend was started with. */
  getWorkspace: (): Promise<string> => ipcRenderer.invoke('get-workspace'),
});
