/**
 * Error handling utilities for LocalAI Code Editor.
 * Provides structured error types and recovery mechanisms.
 */

export class AppError extends Error {
  code: string;
  details?: Record<string, unknown>;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', false);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', false, { field });
  }
}

export class FileOperationError extends AppError {
  constructor(message: string, path?: string) {
    super(message, 'FILE_OPERATION_ERROR', false, { path });
  }
}

export class AgentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AGENT_ERROR', true, details);
  }
}

/**
 * Handle errors consistently across the application.
 */
export function handleError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', false, { context, original: error.message });
  }
  return new AppError(String(error), 'UNKNOWN_ERROR', false, { context });
}

/**
 * Log error to console with context.
 */
export function logError(error: unknown, context?: string): void {
  console.error(`[${context || 'error'}]:`, error);
}

/**
 * Safe async wrapper that catches and handles errors.
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => T,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logError(error, 'safeAsync');
    if (errorHandler) return errorHandler(error);
    return undefined;
  }
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Create error notification for the UI.
 */
export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  dismissed: boolean;
}

let notifications: ErrorNotification[] = [];
let notifCounter = 0;

export function createNotification(
  message: string,
  type: ErrorNotification['type'] = 'error',
): ErrorNotification {
  const notif: ErrorNotification = {
    id: `notif-${++notifCounter}`,
    message,
    type,
    timestamp: new Date(),
    dismissed: false,
  };
  notifications.push(notif);
  return notif;
}

export function dismissNotification(id: string): void {
  const notif = notifications.find(n => n.id === id);
  if (notif) notif.dismissed = true;
}

export function getNotifications(): ErrorNotification[] {
  return notifications.filter(n => !n.dismissed);
}

export function clearNotifications(): void {
  notifications = [];
}