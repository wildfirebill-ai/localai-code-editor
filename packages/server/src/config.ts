import { existsSync, readFileSync } from 'node:fs';
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