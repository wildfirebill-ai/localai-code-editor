# LocalAI Code Editor

**A free, open-source, self-hosted AI code editor powered entirely by your local LLM — no cloud, no API keys, no telemetry.**

LocalAI Code Editor is a multi-platform code editor with a built-in **agentic AI assistant** that works offline with the models you already run locally (Ollama, LM Studio, llama.cpp, or any OpenAI-compatible server). It ships with full **MCP (Model Context Protocol) support**, **agent skills**, **language-server (LSP) IntelliSense**, and a complete **git panel** — all in one installable editor for **Windows, macOS, Linux, and Docker (Unraid)**.

![Language](https://img.shields.io/badge/TypeScript-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Multi-platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Docker-lightgrey)

---

## Why LocalAI Code Editor?

- 🔒 **100% private & offline** — every completion, refactor, and agent run uses your local models. No data ever leaves your machine or your network.
- 🛠️ **Full agentic assistant** — the AI can read and edit files, run shell commands, call MCP tools, load project skills, and iterate until the job is done.
- 🔌 **MCP-first** — connect any local (stdio) or remote (HTTP/SSE) MCP server and its tools become available to the agent automatically.
- 🧠 **Agent skills** — drop `SKILL.md` files into your project or your home directory to teach the agent your conventions.
- 📚 **Real IntelliSense** — LSP language servers give you completion, hover, diagnostics, go-to-definition, find-references, and rename.
- 📋 **Full git panel** — see uncommitted changes, diffs, branch management, and push/pull without leaving the editor.
- 🚀 **One codebase, every target** — the same editor runs as a desktop app, a local web app, or a Docker container.

---

## Table of Contents

- [Features](#features)
- [Local LLM providers](#local-llm-providers)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Agent skills](#agent-skills)
- [Language servers](#language-servers)
- [MCP servers](#mcp-servers)
- [Docker & Unraid](#docker--unraid)
  - [⚠️ Docker socket warning](#️-docker-socket-warning)
  - [Alternative deployment options](#alternative-deployment-options)
- [GitHub Actions / builds](#github-actions--builds)
- [Development](#development)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

| Feature | Description |
| --- | --- |
| **AI agent** | Streamed chat that reads/writes files, runs commands, calls MCP tools, and iterates to completion |
| **Local LLM support** | Auto-detect Ollama, LM Studio, llama.cpp, and any OpenAI-compatible endpoint |
| **MCP client** | Connect local (stdio) and remote (HTTP/SSE) MCP servers; expose their tools to the agent |
| **Agent skills** | Project + user `SKILL.md` files with frontmatter; loaded into the agent on demand |
| **Language servers** | LSP-based completion, hover, diagnostics, definition, references, rename |
| **Git panel** | Status, diff, stage/unstage, commit, branch manager, push/pull, log |
| **File explorer** | Browse, open, edit, and save any file in the workspace |
| **Monaco editor** | The industry-standard editor used by VS Code, running locally |
| **Multi-platform** | Windows, macOS, Linux (Electron), and any web-capable device (Docker) |

---

## Local LLM providers

LocalAI Code Editor connects to **every** major local inference server through their OpenAI-compatible APIs:

- **Ollama** — `http://localhost:11434/v1`
- **LM Studio** — `http://localhost:1234/v1`
- **llama.cpp server** — `http://localhost:8080/v1`
- **Any OpenAI-compatible endpoint** — vLLM, Jan, text-generation-webui, and more

The editor health-checks each endpoint and lets you pick the running provider and model.

---

## Quick start

### Requirements

- **Node.js 20+** and **pnpm 10**
- A local LLM server (e.g. Ollama) running with at least one model pulled

### Install & run

```bash
pnpm install
pnpm build
pnpm dev:server        # starts the server + web UI at http://127.0.0.1:4801
```

Then open **http://127.0.0.1:4801** in your browser, pick your provider and model in the **Agent** panel, and start asking the AI to build, edit, run, and debug your code.

### Desktop app

```bash
pnpm --filter @localai/desktop dev        # run
pnpm --filter @localai/desktop dist       # package installers for your OS
```

---

## Configuration

Create a `localai.config.json` in the workspace (a full example is in [`localai.config.json.example`](localai.config.json.example)):

```jsonc
{
  "workspace": "/path/to/your/repo",
  "port": 4801,
  "host": "127.0.0.1",
  "providers": [
    { "id": "ollama", "label": "Ollama", "baseUrl": "http://localhost:11434/v1" }
  ],
  "mcpServers": { /* ... */ },
  "languageServers": [ /* ... */ ],
  "protectedPaths": [".git"],
  "allowShell": true
}
```

| Key | Purpose |
| --- | --- |
| `providers` | LLM endpoints to connect to |
| `mcpServers` | MCP servers to launch at startup |
| `languageServers` | LSP servers to manage |
| `allowShell` | Whether the agent may run shell commands |
| `protectedPaths` | Paths the file tools may not touch |

---

## Agent skills

Drop a `SKILL.md` into either location and it becomes available to the agent:

- **Project skills:** `<workspace>/.localai/skills/<name>/SKILL.md`
- **User (global) skills:** `~/.localai/skills/<name>/SKILL.md`

```markdown
---
name: ts-check
description: Typecheck a package with pnpm typecheck before committing
---
Run `pnpm typecheck` from the package root and fix any errors.
```

Project skills override same-named global skills. The agent loads them on demand via the `read_skill` tool.

---

## Language servers

Add language servers to `languageServers` in your config for full IntelliSense:

```jsonc
{
  "languageServers": [
    { "id": "typescript", "language": "typescript",
      "extensions": [".ts", ".tsx", ".js", ".jsx"],
      "command": "typescript-language-server", "args": ["--stdio"] },
    { "id": "python", "language": "python",
      "extensions": [".py"],
      "command": "pyright-langserver", "args": ["--stdio"] }
  ]
}
```

Install the server binaries yourself (e.g. `npm i -g typescript-language-server pyright`). Features: **completion, hover, diagnostics, go-to-definition, find-references, rename**.

---

## MCP servers

Connect any MCP server — local subprocesses and remote endpoints:

```jsonc
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "remote": {
      "type": "http",
      "url": "http://localhost:9000/mcp"
    }
  }
}
```

You can also connect servers on the fly from the **MCP** panel in the UI. Tools from all connected servers are exposed to the agent automatically.

---

## Docker & Unraid

LocalAI Code Editor runs headless in Docker and is ideal for **Unraid** via Community Apps or a custom template. The image is published multi-arch (`linux/amd64`, `linux/arm64`) to **GHCR** by CI.

```bash
docker run -d --name localai-code-editor \
  -p 4801:4801 \
  -v /mnt/user/your_repo:/workspace \
  -v /mnt/user/appdata/localai:/root/.localai \
  ghcr.io/<your-user>/localai-code-editor:latest
```

- **WebUI:** `http://<your-unraid-ip>:4801`
- `/workspace` = the repo you want to edit
- `/root/.localai` = persistent skills + config

### ⚠️ Docker socket warning

If you want the editor to **build and test Docker programs from inside the editor** (Option A), you must mount the Docker socket:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

> **WARNING — read this before mounting the Docker socket.**
>
> Mounting `/var/run/docker.sock` into a container grants **root-equivalent control over the entire Docker host** to that container. Because LocalAI Code Editor's AI agent can run **arbitrary shell commands**, anything that can reach the editor's web UI — including a malicious prompt, an untrusted repository it opens, or any user who can reach port `4801` — could effectively take over your Unraid server and everything else on the Docker host.
>
> **Use the socket mount only on a trusted, single-user server where you alone control access.** Never expose the editor's UI to the internet or to untrusted users while the socket is mounted. Prefer to keep it on your LAN only.

### Alternative deployment options

If the socket mount is too risky for your setup, you have safer ways to work with Docker:

| Option | What it does | Security |
| --- | --- | --- |
| **B — Edit here, build on the host** | Develop the Docker program in the editor; build/run it on the Unraid host (or another container) against the same mounted `/workspace` repo. | ✅ **No socket, no risk.** Recommended default. |
| **C — Docker-in-Docker (DinD)** | Run a nested Docker daemon *inside* the editor container, isolated from the host. `docker` commands run against the nested daemon. | ✅ Isolated from the host. Heavier (privileged container, nested overlayfs), slower. |
| **A — Docker CLI + socket** | Mount the socket + docker CLI so the agent can run `docker build` / `docker compose` directly. | ⚠️ Root-equivalent host access. Only for trusted single-user servers. |

**In short:** start with **Option B** for safety. Upgrade to **Option A** only if you truly need the agent to drive Docker from inside the editor and you fully control the network.

---

## GitHub Actions / builds

The included CI pipeline (`.github/workflows/ci.yml`) automates testing and shipping:

| Job | What it does |
| --- | --- |
| `test` | Builds + typechecks + lints + tests on **Windows, macOS, and Linux** |
| `desktop` | Packages desktop installers per OS into release artifacts |
| `docker` | Builds and pushes the **multi-arch Docker image** to `ghcr.io/<repo>` |
| `release` | Publishes artifacts + Docker image on version tags |

Push a `v*` tag to trigger a full release.

---

## Development

```bash
pnpm install
pnpm dev:server   # backend on :4801 (also serves the web UI)
pnpm dev:web      # Vite dev server with hot reload on :5173
pnpm build        # build all packages
pnpm typecheck    # typecheck all packages
pnpm test         # run tests
```

See the [Project structure](#project-structure) below to orient yourself.

---

## Project structure

```
packages/
  provider/   LLM adapters — Ollama, LM Studio, llama.cpp, OpenAI-compatible
  mcp/        MCP host — local (stdio) + remote (HTTP/SSE) servers, tool calls
  agent/      Agentic loop — shell/file tools, tool-call iteration
  git/        Git panel engine — status, diff, branches, push/pull
  skills/     SKILL.md loader — project + user, frontmatter parsing
  lsp/        Language-server host — spawn + JSON-RPC over stdio, WS bridge
  server/     Node backend — WebSocket JSON-RPC + static web UI
apps/
  web/        Editor UI — Monaco, explorer, agent/chat, git panel, MCP/skills
  desktop/    Electron shell — spawns the server, loads the UI
```

---

## Roadmap

- Go-to-definition / references / rename already shipped in the LSP client
- Multi-tab editing, file diff view, and more git operations
- Agent "skills" auto-application and a built-in skills marketplace
- Optional Docker-in-Docker sandbox for safe agent testing
- Configurable fine-tuning of the agent system prompt

---

## License

[MIT](LICENSE) — free to use, modify, and self-host.