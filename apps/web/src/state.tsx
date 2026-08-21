import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { RpcClient } from './rpc';
import type { AgentEvent, ChatEntry, ModelInfo, ProviderInfo, ProviderHealth, RepoStatus, McpServerStatus, McpTool, LspStatus } from './types';

interface AppState {
  client: RpcClient;
  connected: boolean;
  workspace: string;
  providers: ProviderInfo[];
  providerHealth: Record<string, ProviderHealth>;
  models: ModelInfo[];
  activeProvider: string;
  activeModel: string;
  status: RepoStatus | null;
  mcpStatus: McpServerStatus[];
  mcpTools: McpTool[];
  lspStatus: LspStatus[];
  chat: ChatEntry[];
  running: boolean;
  /** Bumped after every agent run so the editor can reload agent-modified files. */
  editorReloadKey: number;
  setActiveProvider: (id: string) => void;
  setActiveModel: (id: string) => void;
  setWorkspace: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
  sendPrompt: (prompt: string) => Promise<void>;
  stop: () => void;
  appendChat: (entry: ChatEntry) => void;
  clearChat: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new RpcClient());
  const [connected, setConnected] = useState(false);
  const [workspace, setWorkspacePath] = useState('');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [providerHealth, setProviderHealth] = useState<Record<string, ProviderHealth>>({});
  const [models, setModels] = useState<ModelInfo[]>([]);
  // Remembered across reloads so you don't re-pick Ollama → model every launch.
  const [activeProvider, setActiveProviderState] = useState(() => localStorage.getItem('localai.provider') ?? '');
  const [activeModel, setActiveModelState] = useState(() => localStorage.getItem('localai.model') ?? '');
  const setActiveProvider = (id: string) => {
    setActiveProviderState(id);
    localStorage.setItem('localai.provider', id);
  };
  const setActiveModel = (id: string) => {
    setActiveModelState(id);
    localStorage.setItem('localai.model', id);
  };
  const [status, setStatus] = useState<RepoStatus | null>(null);
  const [mcpStatus, setMcpStatus] = useState<McpServerStatus[]>([]);
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);
  const [lspStatus, setLspStatus] = useState<LspStatus[]>([]);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [editorReloadKey, setEditorReloadKey] = useState(0);
  const [abort] = useState(() => new AbortController());

  useEffect(() => {
    client
      .connect()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
    return () => {
      abort.abort();
    };
  }, [client, abort]);

  const appendChat = (entry: ChatEntry) => setChat((c) => [...c, entry]);
  const clearChat = () => setChat([]);

  const refresh = async () => {
    try {
      const ws = await client.request<{ workspace: string }>('workspace.get');
      setWorkspacePath(ws.workspace);
      const provs = await client.request<{ providers: ProviderInfo[] }>('providers.list');
      const list = provs.providers ?? [];
      setProviders(list);
      if (list.length && !activeProvider) setActiveProvider(list[0].id);
      const health = await client.request<Record<string, ProviderHealth>>('providers.health');
      setProviderHealth(health);
      const healthy = list.find((p) => health[p.id]?.ok);
      if (healthy && !activeProvider) setActiveProvider(healthy.id);
      // Active provider was removed elsewhere (Settings panel) — fall back.
      if (activeProvider && !list.some((p) => p.id === activeProvider)) {
        setActiveProvider(list[0]?.id ?? '');
        setActiveModel('');
        setModels([]);
      }
      if (activeProvider) {
        const mods = await client.request<ModelInfo[]>('providers.listModels', { providerId: activeProvider });
        setModels(mods);
        if (mods.length && !activeModel) setActiveModel(mods[0].id);
      }
      setStatus(await client.request<RepoStatus>('git.status'));
      setMcpStatus(await client.request<McpServerStatus[]>('mcp.status'));
      setMcpTools(await client.request<McpTool[]>('mcp.listTools'));
      setLspStatus(await client.request<LspStatus[]>('lsp.status'));
    } catch (e) {
      console.error('refresh failed', e);
    }
  };

  useEffect(() => {
    if (connected) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const loadModels = async (providerId: string) => {
    try {
      const mods = await client.request<ModelInfo[]>('providers.listModels', { providerId });
      setModels(mods);
      if (mods.length && !activeModel) setActiveModel(mods[0].id);
    } catch {
      setModels([]);
    }
  };

  const onProviderChange = (id: string) => {
    setActiveProvider(id);
    setActiveModel('');
    void loadModels(id);
  };

  const sendPrompt = async (prompt: string) => {
    if (!activeProvider || !activeModel) {
      appendChat({ role: 'assistant', content: 'Select a provider and model first.' });
      return;
    }
    appendChat({ role: 'user', content: prompt });
    setRunning(true);
    const reply: string[] = [];
    let sawTools = false;
    const off = client.onEvent((params) => {
      const ev = params as AgentEvent;
      if (ev.type === 'delta') {
        reply.push(ev.content);
      } else if (ev.type === 'tool_call') {
        sawTools = true;
        appendChat({ role: 'tool', content: `\u2699\uFE0F ${ev.toolCall.name}` });
      } else if (ev.type === 'tool_result') {
        appendChat({ role: 'tool', content: ev.result.ok ? `\u2713 done` : `\u274C ${ev.result.content}` });
      }
    });
    try {
      await client.request('agent.run', {
        providerId: activeProvider,
        model: activeModel,
        prompt,
      });
      if (reply.length) appendChat({ role: 'assistant', content: reply.join('') });
      if (sawTools) refresh();
    } catch (e) {
      appendChat({ role: 'assistant', content: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      off();
      setRunning(false);
      // The agent may have edited the open file — let the editor pick it up.
      setEditorReloadKey((k) => k + 1);
    }
  };

  const stop = () => {
    // Server aborts the run; agent.run then resolves and running flips false.
    void client.request('agent.stop').catch(() => {});
  };

  const setWorkspace = async (path: string) => {
    await client.request('workspace.set', { path });
    setActiveModel('');
    setModels([]);
    await refresh();
  };

  const value: AppState = {
    client,
    connected,
    workspace,
    providers,
    providerHealth,
    models,
    activeProvider,
    activeModel,
    status,
    mcpStatus,
    mcpTools,
    lspStatus,
    chat,
    running,
    editorReloadKey,
    setActiveProvider: onProviderChange,
    setActiveModel,
    setWorkspace,
    refresh,
    sendPrompt,
    stop,
    appendChat,
    clearChat,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}