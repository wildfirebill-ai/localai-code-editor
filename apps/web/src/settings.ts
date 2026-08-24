/**
 * Settings persistence for LocalAI Code Editor.
 * Saves user preferences to localStorage.
 */

export interface EditorSettings {
  theme: 'dark' | 'light' | 'system';
  lastOpenFile: string;
  recentWorkspaces: string[];
  fontSize: number;
  showMinimap: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn';
  tabSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  enableAgentHistory: boolean;
  maxHistoryItems: number;
}

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'dark',
  lastOpenFile: '',
  recentWorkspaces: [],
  fontSize: 14,
  showMinimap: true,
  wordWrap: 'off',
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  enableAgentHistory: true,
  maxHistoryItems: 100,
};

const STORAGE_KEY = 'localai-editor-settings';

/**
 * Load settings from localStorage, falling back to defaults.
 */
export function loadSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage.
 */
export function saveSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Update a specific setting and save.
 */
export function updateSetting<K extends keyof EditorSettings>(
  key: K,
  value: EditorSettings[K]
): EditorSettings {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}

/**
 * Add a workspace to recent list.
 */
export function addRecentWorkspace(workspace: string): EditorSettings {
  const settings = loadSettings();
  const recent = settings.recentWorkspaces.filter((w) => w !== workspace);
  recent.unshift(workspace);
  settings.recentWorkspaces = recent.slice(0, 10); // Keep last 10
  saveSettings(settings);
  return settings;
}

/**
 * Clear all settings (reset to defaults).
 */
export function resetSettings(): EditorSettings {
  const settings = { ...DEFAULT_SETTINGS };
  saveSettings(settings);
  return settings;
}

/**
 * Export settings as JSON string.
 */
export function exportSettings(settings: EditorSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON string.
 */
export function importSettings(json: string): EditorSettings | null {
  try {
    const parsed = JSON.parse(json);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to import settings:', e);
    return null;
  }
}