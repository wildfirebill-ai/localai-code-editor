import { parseArgs } from 'node:util';
import { EditorServer } from './server.js';
import { loadConfig, configPath } from './config.js';

const { values } = parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    workspace: { type: 'string', short: 'w' },
    port: { type: 'string', short: 'p' },
    host: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log([
    'LocalAI Code Editor server',
    '',
    'Options:',
    '  -c, --config <path>   JSON config file (default: ./localai.config.json)',
    '  -w, --workspace <dir> Workspace root to edit',
    '  -p, --port <n>        Port (default 4801)',
    '      --host <host>     Bind host (default 127.0.0.1; use 0.0.0.0 for containers)',
    '',
    'Config schema: providers[], mcpServers{}, protectedPaths[], allowShell',
  ].join('\n'));
  process.exit(0);
}

const config = loadConfig(values.config ?? configPath());
if (values.workspace) config.workspace = values.workspace;
if (values.port) config.port = Number(values.port);
if (values.host) config.host = values.host;

// Wrapped in main() so this file also bundles cleanly to CJS (esbuild build:bundle).
async function main(): Promise<void> {
  const server = new EditorServer(config);
  await server.start();

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      await server.stop();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});