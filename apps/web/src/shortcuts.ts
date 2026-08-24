/**
 * Keyboard shortcuts reference and management.
 */

export interface Shortcut {
  key: string;
  description: string;
  category: string;
  mac?: string;
}

/**
 * Default keyboard shortcuts for LocalAI Code Editor.
 */
export const defaultShortcuts: Shortcut[] = [
  // File operations
  { key: 'Ctrl+S', description: 'Save file', category: 'File' },
  { key: 'Ctrl+Shift+S', description: 'Save all files', category: 'File' },
  { key: 'Ctrl+N', description: 'New file', category: 'File', mac: 'Cmd+N' },
  { key: 'Ctrl+O', description: 'Open file', category: 'File', mac: 'Cmd+O' },
  { key: 'Ctrl+W', description: 'Close file', category: 'File', mac: 'Cmd+W' },
  
  // Editing
  { key: 'Ctrl+Z', description: 'Undo', category: 'Edit', mac: 'Cmd+Z' },
  { key: 'Ctrl+Shift+Z', description: 'Redo', category: 'Edit', mac: 'Cmd+Shift+Z' },
  { key: 'Ctrl+X', description: 'Cut', category: 'Edit', mac: 'Cmd+X' },
  { key: 'Ctrl+C', description: 'Copy', category: 'Edit', mac: 'Cmd+C' },
  { key: 'Ctrl+V', description: 'Paste', category: 'Edit', mac: 'Cmd+V' },
  { key: 'Ctrl+A', description: 'Select all', category: 'Edit', mac: 'Cmd+A' },
  { key: 'Ctrl+D', description: 'Duplicate line', category: 'Edit', mac: 'Cmd+D' },
  { key: 'Ctrl+/', description: 'Toggle comment', category: 'Edit', mac: 'Cmd+/' },
  { key: 'Shift+Alt+F', description: 'Format document', category: 'Edit', mac: 'Shift+Option+F' },
  
  // Navigation
  { key: 'Ctrl+P', description: 'Quick open file', category: 'Navigation', mac: 'Cmd+P' },
  { key: 'Ctrl+G', description: 'Go to line', category: 'Navigation', mac: 'Cmd+G' },
  { key: 'Ctrl+Shift+F', description: 'Search across files', category: 'Navigation', mac: 'Cmd+Shift+F' },
  { key: 'Ctrl+F', description: 'Find in current file', category: 'Navigation', mac: 'Cmd+F' },
  { key: 'Ctrl+H', description: 'Find and replace', category: 'Navigation', mac: 'Cmd+H' },
  { key: 'F12', description: 'Go to definition', category: 'Navigation' },
  { key: 'Shift+F12', description: 'Find all references', category: 'Navigation' },
  { key: 'Ctrl+Shift+O', description: 'Go to symbol in file', category: 'Navigation', mac: 'Cmd+Shift+O' },
  
  // View
  { key: 'Ctrl+B', description: 'Toggle sidebar', category: 'View', mac: 'Cmd+B' },
  { key: 'Ctrl+\\', description: 'Split editor', category: 'View', mac: 'Cmd+\\' },
  { key: 'Ctrl+1', description: 'Focus editor', category: 'View', mac: 'Cmd+1' },
  { key: 'Ctrl+2', description: 'Focus terminal', category: 'View', mac: 'Cmd+2' },
  { key: 'Ctrl+Shift+P', description: 'Command palette', category: 'View', mac: 'Cmd+Shift+P' },
  { key: 'Ctrl+Shift+G', description: 'Source control', category: 'View', mac: 'Cmd+Shift+G' },
  
  // Agent
  { key: 'Ctrl+Enter', description: 'Run agent', category: 'Agent', mac: 'Cmd+Enter' },
  { key: 'Escape', description: 'Stop agent', category: 'Agent' },
  { key: 'Ctrl+Shift+A', description: 'Agent panel', category: 'Agent', mac: 'Cmd+Shift+A' },
  
  // Window
  { key: 'Ctrl+W', description: 'Close tab', category: 'Window', mac: 'Cmd+W' },
  { key: 'Ctrl+Tab', description: 'Switch tab', category: 'Window', mac: 'Cmd+Tab' },
  { key: 'Ctrl+Shift+T', description: 'Reopen closed tab', category: 'Window', mac: 'Cmd+Shift+T' },
];

/**
 * Get keyboard shortcut for the current platform.
 */
export function getPlatformKey(shortcut: Shortcut): string {
  const isMac = navigator.platform.includes('Mac');
  return shortcut.mac && isMac ? shortcut.mac : shortcut.key;
}

/**
 * Format keyboard shortcut for display.
 */
export function formatShortcut(shortcut: Shortcut): string {
  const key = getPlatformKey(shortcut);
  return key.split('+').map(k => {
    if (k === 'Ctrl') return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
    if (k === 'Shift') return navigator.platform.includes('Mac') ? '⇧' : 'Shift';
    if (k === 'Alt') return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
    return k;
  }).join(' + ');
}

/**
 * Check if a keyboard event matches a shortcut.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const key = getPlatformKey(shortcut);
  const parts = key.split('+').map(p => p.toLowerCase());
  
  const ctrlKey = parts.includes('ctrl') || parts.includes('cmd');
  const shiftKey = parts.includes('shift');
  const altKey = parts.includes('alt');
  const mainKey = parts.find(p => !['ctrl', 'cmd', 'shift', 'alt'].includes(p));
  
  return (
    event.ctrlKey === ctrlKey &&
    event.shiftKey === shiftKey &&
    event.altKey === altKey &&
    event.key.toLowerCase() === mainKey?.toLowerCase()
  );
}