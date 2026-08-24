/**
 * Auto-save functionality for the editor.
 * Saves files automatically after a delay when the user makes changes.
 */

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPath: string | null = null;
let autoSaveEnabled = false;
let autoSaveDelay = 1000;

/**
 * Set up auto-save with a given delay.
 */
export function setupAutoSave(delay: number = 1000): void {
  autoSaveDelay = delay;
  autoSaveEnabled = true;
}

/**
 * Disable auto-save.
 */
export function disableAutoSave(): void {
  autoSaveEnabled = false;
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  pendingPath = null;
}

/**
 * Enable auto-save.
 */
export function enableAutoSave(): void {
  autoSaveEnabled = true;
}

/**
 * Check if auto-save is enabled.
 */
export function isAutoSaveEnabled(): boolean {
  return autoSaveEnabled;
}

/**
 * Trigger auto-save for a file path.
 * Debounces to avoid saving on every keystroke.
 */
export function triggerAutoSave(
  path: string,
  saveFn: (path: string) => Promise<void>
): void {
  if (!autoSaveEnabled || !path) return;

  pendingPath = path;

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(async () => {
    if (pendingPath && autoSaveEnabled) {
      try {
        await saveFn(pendingPath);
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }
    pendingPath = null;
    autoSaveTimer = null;
  }, autoSaveDelay);
}

/**
 * Cancel any pending auto-save.
 */
export function cancelAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    pendingPath = null;
  }
}