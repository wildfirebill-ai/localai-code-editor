/**
 * Command Palette - quick access to all editor commands.
 */

export interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

/**
 * Default commands for the LocalAI Code Editor.
 */
export const defaultCommands: Command[] = [
  {
    id: 'file.save',
    label: 'Save File',
    category: 'File',
    shortcut: 'Ctrl+S',
    action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true })),
  },
  {
    id: 'file.find',
    label: 'Find in Files',
    category: 'File',
    shortcut: 'Ctrl+F',
    action: () => document.querySelector<HTMLInputElement>('[data-search]')?.focus(),
  },
  {
    id: 'agent.run',
    label: 'Run Agent',
    category: 'Agent',
    shortcut: 'Ctrl+Enter',
    action: () => document.querySelector<HTMLButtonElement>('.chat-panel button[type="submit"]')?.click(),
  },
  {
    id: 'agent.stop',
    label: 'Stop Agent',
    category: 'Agent',
    shortcut: 'Escape',
    action: () => {}, // Handled by state
  },
  {
    id: 'view.explorer',
    label: 'Toggle Explorer',
    category: 'View',
    action: () => document.querySelector<HTMLElement>('[data-tab="explorer"]')?.click(),
  },
  {
    id: 'view.search',
    label: 'Toggle Search',
    category: 'View',
    shortcut: 'Ctrl+Shift+F',
    action: () => document.querySelector<HTMLElement>('[data-tab="search"]')?.click(),
  },
  {
    id: 'view.terminal',
    label: 'Toggle Terminal',
    category: 'View',
    action: () => {}, // Would open integrated terminal
  },
  {
    id: 'editor.format',
    label: 'Format Document',
    category: 'Editor',
    shortcut: 'Shift+Alt+F',
    action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F', shiftKey: true, altKey: true })),
  },
  {
    id: 'editor.foldAll',
    label: 'Fold All',
    category: 'Editor',
    shortcut: 'Ctrl+K Ctrl+0',
    action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: '0', ctrlKey: true, metaKey: true })),
  },
  {
    id: 'editor.unfoldAll',
    label: 'Unfold All',
    category: 'Editor',
    shortcut: 'Ctrl+K Ctrl+J',
    action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'J', ctrlKey: true, metaKey: true })),
  },
  {
    id: 'git.commit',
    label: 'Git Commit',
    category: 'Git',
    action: () => document.querySelector<HTMLElement>('[data-tab="git"]')?.click(),
  },
  {
    id: 'settings.open',
    label: 'Open Settings',
    category: 'Help',
    shortcut: 'Ctrl+,',
    action: () => {}, // Would open settings panel
  },
  {
    id: 'help.shortcuts',
    label: 'Show Keyboard Shortcuts',
    category: 'Help',
    action: () => {}, // Would show shortcuts dialog
  },
];

/**
 * Command registry manager.
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  constructor() {
    // Register default commands
    for (const cmd of defaultCommands) {
      this.commands.set(cmd.id, cmd);
    }
  }

  /**
   * Register a new command.
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Execute a command by ID.
   */
  execute(id: string): boolean {
    const cmd = this.commands.get(id);
    if (cmd) {
      cmd.action();
      return true;
    }
    return false;
  }

  /**
   * Search commands by query.
   */
  search(query: string): Command[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return [...this.commands.values()].filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  }

  /**
   * Get all commands.
   */
  getAll(): Command[] {
    return [...this.commands.values()];
  }

  /**
   * Get commands by category.
   */
  getByCategory(category: string): Command[] {
    return [...this.commands.values()].filter(cmd => cmd.category === category);
  }

  /**
   * Get all unique categories.
   */
  getCategories(): string[] {
    const cats = new Set<string>();
    for (const cmd of this.commands.values()) {
      cats.add(cmd.category);
    }
    return [...cats].sort();
  }
}

/**
 * Global command registry singleton.
 */
export const commandRegistry = new CommandRegistry();