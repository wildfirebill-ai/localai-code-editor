/**
 * Agent Task History — stores recent agent runs with their messages,
 * tool calls, and file changes. Everything lives in memory (Map-based)
 * and optionally persists to a JSON file for persistence across restarts.
 */

export interface TaskEntry {
  id: string;
  timestamp: Date;
  prompt: string;
  provider: string;
  model: string;
  messages: MessageRecord[];
  filesChanged: string[];
  toolsCalled: string[];
  status: 'completed' | 'cancelled' | 'failed' | 'in-progress';
}

export interface MessageRecord {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolName?: string;
  filePath?: string;
  success?: boolean;
  timestamp: Date;
}

const MAX_HISTORY = 100;
let taskHistory: TaskEntry[] = [];
let currentTask: TaskEntry | null = null;
let taskCounter = 0;

/**
 * Start recording a new agent task.
 */
export function startTask(prompt: string, provider: string, model: string): TaskEntry {
  const task: TaskEntry = {
    id: `task-${Date.now()}-${++taskCounter}`,
    timestamp: new Date(),
    prompt,
    provider,
    model,
    messages: [],
    filesChanged: [],
    toolsCalled: [],
    status: 'in-progress',
  };
  currentTask = task;
  taskHistory.unshift(task);
  if (taskHistory.length > MAX_HISTORY) taskHistory.pop();
  return task;
}

/**
 * Record a message (user prompt, assistant response, tool call/result).
 */
export function recordMessage(
  role: MessageRecord['role'],
  content: string,
  opts?: { toolName?: string; filePath?: string; success?: boolean }
): void {
  if (!currentTask) return;
  const msg: MessageRecord = {
    role,
    content,
    toolName: opts?.toolName,
    filePath: opts?.filePath,
    success: opts?.success,
    timestamp: new Date(),
  };
  currentTask.messages.push(msg);
  if (opts?.toolName && !currentTask.toolsCalled.includes(opts.toolName)) {
    currentTask.toolsCalled.push(opts.toolName);
  }
  if (opts?.filePath && !currentTask.filesChanged.includes(opts.filePath)) {
    currentTask.filesChanged.push(opts.filePath);
  }
}

/**
 * Mark current task as completed/cancelled/failed.
 */
export function finishTask(status: TaskEntry['status'] = 'completed'): TaskEntry | null {
  if (!currentTask) return null;
  currentTask.status = status;
  const task = currentTask;
  currentTask = null;
  return task;
}

/**
 * Get all recorded tasks (most recent first).
 */
export function getTaskHistory(): TaskEntry[] {
  return [...taskHistory];
}

/**
 * Get a specific task by ID.
 */
export function getTaskById(id: string): TaskEntry | undefined {
  return taskHistory.find((t) => t.id === id);
}

/**
 * Get the currently running task (if any).
 */
export function getCurrentTask(): TaskEntry | null {
  return currentTask ? { ...currentTask } : null;
}

/**
 * Clear all history.
 */
export function clearTaskHistory(): void {
  taskHistory = [];
  currentTask = null;
  taskCounter = 0;
}