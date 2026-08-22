import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PRESETS, type ProviderConfig } from '@localai/provider';
import type { McpServerConfig } from '@localai/mcp';
import type { LanguageServerConfig } from '@localai/lsp';

export interface ServerConfig {
  /** Root directory served/edited. */
  workspace: string;
  /** Port for the WebSocket/HTTP server. */
  port: number;
  /** Host to bind. 0.0.0.0 to allow remote/container access. */
  host: string;
  /** LLM providers to register. */
  providers: ProviderConfig[];
  /** MCP servers to connect at startup. */
  mcpServers: Record<string, McpServerConfig>;
  /** LSP language servers to manage. */
  languageServers: LanguageServerConfig[];
  /** List of paths (relative to workspace) that the file tools may NOT touch. */
  protectedPaths: string[];
  /** Whether the agent's shell tool may run (gate). */
  allowShell: boolean;
}

const DEFAULTS: ServerConfig = {
  workspace: process.cwd(),
  port: 4801,
  host: '127.0.0.1',
  providers: PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    baseUrl: p.defaultBaseUrl,
    apiKey: p.defaultApiKey,
  })),
  mcpServers: {},
  languageServers: [],
  protectedPaths: ['.git'],
  allowShell: true,
};

export function loadConfig(path?: string): ServerConfig {
  if (!path) return { ...DEFAULTS, workspace: process.cwd() };
  const resolved = resolve(path);
  if (!existsSync(resolved)) return { ...DEFAULTS, workspace: process.cwd() };
  const raw = JSON.parse(readFileSync(resolved, 'utf-8')) as Partial<ServerConfig>;
  return {
    ...DEFAULTS,
    ...raw,
    providers: raw.providers ?? DEFAULTS.providers,
    mcpServers: raw.mcpServers ?? {},
    languageServers: raw.languageServers ?? [],
    protectedPaths: raw.protectedPaths ?? DEFAULTS.protectedPaths,
  };
}

export function configPath(): string {
  return resolve(process.cwd(), 'localai.config.json');
}

/**
 * User-editable runtime settings, stored inside the workspace so they survive
 * restarts in dev, desktop, and Docker alike: <workspace>/.localai/settings.json
 */
interface WorkspaceSettings {
  providers?: ProviderConfig[];
  languageServers?: LanguageServerConfig[];
}

function settingsPath(workspace: string): string {
  return resolve(workspace, '.localai', 'settings.json');
}

export function loadLanguageServerOverrides(workspace: string): LanguageServerConfig[] {
  const file = settingsPath(workspace);
  if (!existsSync(file)) return [];
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as WorkspaceSettings;
    return Array.isArray(raw.languageServers) ? raw.languageServers : [];
  } catch (e) {
    console.error(`Ignoring malformed ${file}:`, e instanceof Error ? e.message : e);
    return [];
  }
}

export function saveLanguageServerOverrides(workspace: string, languageServers: LanguageServerConfig[]): void {
  const file = settingsPath(workspace);
  mkdirSync(resolve(file, '..'), { recursive: true });
  // Preserve provider overrides when saving LSP changes: read current file first.
  let providers: ProviderConfig[] | undefined;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as WorkspaceSettings;
    providers = raw.providers;
  } catch { /* no existing file */ }
  writeFileSync(file, `${JSON.stringify({ providers, languageServers }, null, 2)}\n`, 'utf-8');
}

/** Merge LSP overrides over base config by id; new ids append. */
export function applyLanguageServerOverrides(
  base: LanguageServerConfig[],
  overrides: LanguageServerConfig[]
): LanguageServerConfig[] {
  const byId = new Map(base.map((l) => [l.id, l]));
  for (const o of overrides) byId.set(o.id, o);
  return [...byId.values()];
}

export function loadProviderOverrides(workspace: string): ProviderConfig[] {
  const file = settingsPath(workspace);
  if (!existsSync(file)) return [];
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as WorkspaceSettings;
    return Array.isArray(raw.providers) ? raw.providers : [];
  } catch (e) {
    console.error(`Ignoring malformed ${file}:`, e instanceof Error ? e.message : e);
    return [];
  }
}

/** Merge overrides over the base list: same id replaces, new ids append. */
export function applyProviderOverrides(base: ProviderConfig[], overrides: ProviderConfig[]): ProviderConfig[] {
  const byId = new Map(base.map((p) => [p.id, p]));
  for (const o of overrides) byId.set(o.id, o);
  return [...byId.values()];
}

export function saveProviderOverrides(workspace: string, providers: ProviderConfig[]): void {
  const file = settingsPath(workspace);
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ providers }, null, 2)}\n`, 'utf-8');
}