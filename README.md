# LocalAI Code Editor

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-orange)](https://pnpm.io/)
[![Electron](https://img.shields.io/badge/Electron-33-9feaf9)](https://www.electronjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-v0.48-007ACC)](https://microsoft.github.io/monaco-editor/)
[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-purple)](https://modelcontextprotocol.io/)
[![Ollama](https://img.shields.io/badge/Ollama-Compatible-black)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-GHCR-blue)](https://ghcr.io/wildfirebill-ai/localai-code-editor)
[![Release](https://img.shields.io/github/v/release/wildfirebill-ai/localai-code-editor)](https://github.com/wildfirebill-ai/localai-code-editor/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/wildfirebill-ai/localai-code-editor/ci.yml?label=CI)](https://github.com/wildfirebill-ai/localai-code-editor/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

> **A free, open-source, self-hosted AI code editor powered entirely by your local LLM — no cloud, no API keys, no telemetry.**

![LocalAI Code Editor Screenshot](docs/images/screenshot-editor.png)

LocalAI Code Editor is a multi-platform code editor with a built-in **agentic AI assistant** that works offline with the models you already run locally (Ollama, LM Studio, llama.cpp, or any OpenAI-compatible server). It ships with full **MCP (Model Context Protocol) support**, **agent skills**, **language-server (LSP) IntelliSense**, and a complete **git panel** — all in one installable editor for **Windows, macOS, Linux, and Docker (Unraid)**.

## 🎯 Why LocalAI Code Editor?

| Feature | Benefit |
|---------|---------|
| 🔒 **100% Private & Offline** | Every completion, refactor, and agent run uses your local models. No data ever leaves your machine or your network. |
| 🛠️ **Full Agentic Assistant** | The AI reads/writes files, runs shell commands, calls MCP tools, loads project skills, and iterates until the job is done. |
| 🔌 **MCP-First Architecture** | Connect any local (stdio) or remote (HTTP/SSE) MCP server — its tools become available to the agent automatically. |
| 🧠 **Agent Skills System** | Drop `SKILL.md` files into your project or home directory to teach the agent your conventions, workflows, and best practices. |
| 📚 **Real IntelliSense** | LSP language servers provide completion, hover, diagnostics, go-to-definition, find-references, and rename. |
| 📋 **Complete Git Panel** | Status, diff, stage/unstage, commit, branch management, push/pull, and log — all without leaving the editor. |
| 🚀 **One Codebase, Every Target** | Runs as a desktop app (Electron), local web app, or Docker container (Unraid, Kubernetes, any Docker host). |

## 📋 Table of Contents

- [Features](#features)
- [Supported LLM Providers](#supported-llm-providers)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Agent Skills](#agent-skills)
- [Language Servers (LSP)](#language-servers-lsp)
- [MCP Servers](#mcp-servers)
- [Docker & Unraid Deployment](#docker--unraid-deployment)
- [Development](#development)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## ✨ Features

| Category | Capabilities |
|----------|--------------|
| **AI Agent** | Streamed chat that reads/writes files, runs commands, calls MCP tools, and iterates to completion |
| **Local LLM Support** | Auto-detect Ollama, LM Studio, llama.cpp, and any OpenAI-compatible endpoint |
| **Provider Setup UI** | Add, edit, test, and remove providers at runtime (Settings panel) — persisted per workspace |
| **Workspace Management** | Native folder picker on launch; switch projects anytime; live-rebinds git/skills/LSP |
| **MCP Client** | Connect local (stdio) and remote (HTTP/SSE) MCP servers; expose their tools to the agent |
| **Agent Skills** | Project + user `SKILL.md` files with frontmatter; loaded into the agent on demand |
| **Language Servers** | LSP-based completion, hover, diagnostics, definition, references, rename |
| **Git Panel** | Status, diff, stage/unstage, commit, branch manager, push/pull, log |
| **File Explorer** | Browse, open, edit, save — plus New File/Folder, Rename, and Delete from the sidebar |
| **Monaco Editor** | The industry-standard editor used by VS Code, running locally |
| **Multi-Platform** | Windows, macOS, Linux (Electron), and any web-capable device (Docker) |

---

## 🤖 Supported LLM Providers

LocalAI Code Editor connects to **every** major local inference server through their OpenAI-compatible APIs:

- **Ollama** — `http://localhost:11434/v1`
- **LM Studio** — `http://localhost:1234/v1`
- **llama.cpp server** — `http://localhost:8080/v1`
- **vLLM** — `http://localhost:8000/v1`
- **Jan** — `http://localhost:1337/v1`
- **Text-Generation-WebUI** — `http://localhost:5000/v1`
- **Any OpenAI-compatible endpoint** — Custom servers, enterprise proxies, and more

The editor health-checks each endpoint and lets you pick the running provider and model from the **Agent** panel.

### Configuring providers from the UI

No config file needed — open the **Settings** panel (⚡ icon) → **LLM Providers**:

- See every provider with live health/latency
- **Add** a provider from a preset (Ollama, LM Studio, llama.cpp, vLLM) or any custom OpenAI-compatible URL
- **Edit** label / base URL / API key, **Test** the connection before saving, or **Remove**
- Settings persist to `<workspace>/.localai/settings.json` and survive restarts (dev, desktop, and Docker)

---

## 🚀 Quick Start

### Requirements

- **Node.js 20+** and **pnpm 10**
- A local LLM server (e.g. Ollama) running with at least one model pulled:
  ```bash
  ollama pull codellama:13b
  ollama serve
  ```

### Install & Run (Web UI)

```bash
git clone https://github.com/wildfirebill-ai/localai-code-editor.git
cd localai-code-editor
pnpm install
pnpm build
pnpm dev:server        # starts the server + web UI at http://127.0.0.1:4801
```

Open **http://127.0.0.1:4801** in your browser, pick your provider and model in the **Agent** panel, and start asking the AI to build, edit, run, and debug your code.

### Desktop App (Electron)

```bash
pnpm --filter @localai/desktop dev        # run with hot reload
pnpm --filter @localai/desktop dist       # package installers for your OS
```

On first launch the desktop app asks you to **pick a project folder** (native dialog). You can switch projects anytime from **Settings → Workspace → Open Folder…**, or by typing an absolute path (also works in browser/Docker mode).

> Or skip the build entirely — grab a ready-made installer from the [latest release](https://github.com/wildfirebill-ai/localai-code-editor/releases/latest).

### Docker (Production / Unraid)

```bash
docker run -d --name localai-code-editor \
  -p 4801:4801 \
  -v /path/to/your/repo:/workspace \
  -v /path/to/config:/root/.localai \
  ghcr.io/wildfirebill-ai/localai-code-editor:latest
```

- **WebUI:** `http://<your-host>:4801`
- `/workspace` = the repo you want to edit
- `/root/.localai` = persistent skills + config

---

## ⚙️ Configuration

Create a `localai.config.json` in your workspace (full example: [`localai.config.json.example`](localai.config.json.example)):

```jsonc
{
  "workspace": "/path/to/your/repo",
  "port": 4801,
  "host": "127.0.0.1",
  "providers": [
    { "id": "ollama", "label": "Ollama", "baseUrl": "http://localhost:11434/v1" }
  ],
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  },
  "languageServers": [
    { "id": "typescript", "language": "typescript", "extensions": [".ts", ".tsx"], "command": "typescript-language-server", "args": ["--stdio"] }
  ],
  "protectedPaths": [".git"],
  "allowShell": true
}
```

| Key | Purpose |
|-----|---------|
| `providers` | LLM endpoints to connect to (auto-detects Ollama, LM Studio, etc.) |
| `mcpServers` | MCP servers to launch at startup (stdio or HTTP) |
| `languageServers` | LSP servers to manage for IntelliSense |
| `allowShell` | Whether the agent may run shell commands |
| `protectedPaths` | Paths the file tools may not touch (e.g. `.git`, `.env`) |

---

## 🧠 Agent Skills

Agent Skills are Markdown files with frontmatter that teach the AI your conventions, workflows, and best practices. Drop a `SKILL.md` into either location:

- **Project skills:** `<workspace>/.localai/skills/<name>/SKILL.md`
- **User (global) skills:** `~/.localai/skills/<name>/SKILL.md`

```markdown
---
name: ts-check
description: Typecheck a package with pnpm typecheck before committing
---
Run `pnpm typecheck` from the package root and fix any errors.
```

Project skills override same-named global skills. The agent loads them on demand via the `read_skill` tool. See [example skills](.localai/skills/) and [SKILL.md spec](https://github.com/wildfirebill-ai/localai-code-editor/blob/main/docs/skill-spec.md).

---

## 📚 Language Servers (LSP)

Add language servers to `languageServers` in your config for full IntelliSense:

```jsonc
{
  "languageServers": [
    { "id": "typescript", "language": "typescript", "extensions": [".ts", ".tsx", ".js", ".jsx"], "command": "typescript-language-server", "args": ["--stdio"] },
    { "id": "python", "language": "python", "extensions": [".py"], "command": "pyright-langserver", "args": ["--stdio"] },
    { "id": "rust", "language": "rust", "extensions": [".rs"], "command": "rust-analyzer", "args": [] }
  ]
}
```

Install the server binaries yourself:
```bash
npm i -g typescript-language-server pyright rust-analyzer
```

Features: **completion, hover, diagnostics, go-to-definition, find-references, rename**.

---

## 🔌 MCP Servers

Connect any MCP server — local subprocesses and remote endpoints:

```jsonc
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost/db"]
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

## 🐳 Docker & Unraid Deployment

LocalAI Code Editor runs headless in Docker and is ideal for **Unraid** via Community Apps or a custom template. The image is published multi-arch (`linux/amd64`, `linux/arm64`) to **GHCR** by CI.

```bash
docker run -d --name localai-code-editor \
  -p 4801:4801 \
  -v /mnt/user/your_repo:/workspace \
  -v /mnt/user/appdata/localai:/root/.localai \
  ghcr.io/wildfirebill-ai/localai-code-editor:latest
```

- **WebUI:** `http://<your-unraid-ip>:4801`
- `/workspace` = the repo you want to edit
- `/root/.localai` = persistent skills + config

### ⚠️ Docker Socket Warning

If you want the editor to **build and test Docker programs from inside the editor**, you must mount the Docker socket:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

> **WARNING — read this before mounting the Docker socket.**
>
> Mounting `/var/run/docker.sock` into a container grants **root-equivalent control over the entire Docker host** to that container. Because LocalAI Code Editor's AI agent can run **arbitrary shell commands**, anything that can reach the editor's web UI — including a malicious prompt, an untrusted repository it opens, or any user who can reach port `4801` — could effectively take over your Unraid server and everything else on the Docker host.
>
> **Use the socket mount only on a trusted, single-user server where you alone control access.** Never expose the editor's UI to the internet or to untrusted users while the socket is mounted. Prefer to keep it on your LAN only.

### Alternative Deployment Options

| Option | What it does | Security |
|--------|--------------|----------|
| **B — Edit here, build on the host** | Develop the Docker program in the editor; build/run it on the Unraid host against the same mounted `/workspace` repo. | ✅ **No socket, no risk.** Recommended default. |
| **C — Docker-in-Docker (DinD)** | Run a nested Docker daemon *inside* the editor container, isolated from the host. | ✅ Isolated from the host. Heavier (privileged container). |
| **A — Docker CLI + socket** | Mount the socket + docker CLI so the agent can run `docker build` / `docker compose` directly. | ⚠️ Root-equivalent host access. Only for trusted single-user servers. |

**In short:** start with **Option B** for safety. Upgrade to **Option A** only if you truly need the agent to drive Docker from inside the editor and you fully control the network.

---

## 🛠️ Development

```bash
# Setup
pnpm install

# Development servers
pnpm dev:server   # backend on :4801 (also serves the web UI)
pnpm dev:web      # Vite dev server with hot reload on :5173
pnpm dev:desktop  # Electron with hot reload

# Build & Quality
pnpm build        # build all packages
pnpm typecheck    # typecheck all packages
pnpm lint         # lint all packages
pnpm test         # run tests
```

See [Project Structure](#project-structure) and [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📁 Project Structure

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

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the detailed roadmap.

### High-Level Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Core editor + agent loop | v0.1 | ✅ Done |
| MCP + Skills system | v0.1 | ✅ Done |
| LSP IntelliSense | v0.1 | ✅ Done |
| Git panel | v0.1 | ✅ Done |
| Multi-platform (Win/Mac/Linux/Docker) | v0.1 | ✅ Done |
| Agent skills marketplace | v0.2 | 🔄 Planned |
| Docker-in-Docker sandbox | v0.2 | 🔄 Planned |
| Agent system prompt tuning UI | v0.3 | 📋 Backlog |
| Multi-tab editing & file diff view | v0.3 | 📋 Backlog |
| Remote collaboration (multi-user) | v0.4 | 📋 Backlog |
| Plugin/extension API | v0.5 | 📋 Backlog |

---

## 🏷️ CI & Releases

Both workflows (`ci.yml`, `docker.yml`) run **only** when:

1. A version tag is pushed — `git tag v0.1.4 && git push --tags` — or
2. Manually triggered from the **Actions** tab (`workflow_dispatch`)

Everyday pushes to `main` and pull requests do **not** run CI. Pushing a `v*` tag triggers the full pipeline:

| Job | What it does |
| --- | --- |
| `test` | Builds + typechecks + lints + tests on Windows, macOS, and Linux |
| `desktop` | Packages installers per OS (NSIS/zip, DMG/zip, AppImage/deb/tar.gz) |
| `release` | Publishes all desktop artifacts to a GitHub Release with generated notes |
| `docker` | Builds and pushes the multi-arch image to `ghcr.io` with semver tags |

---

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### Recent Releases

| Version | Date | Highlights |
|---------|------|------------|
| [v0.1.4](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.4) | 2026-08-21 | Workspace picker + runtime switching, Explorer file ops (new/rename/delete) |
| [v0.1.3](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.3) | 2026-08-21 | Provider connection settings UI — add/edit/test/remove at runtime |
| [v0.1.2](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.2) | 2026-08-21 | Fix Windows launch crash (ELECTRON_RUN_AS_NODE), EPIPE guard |
| [v0.1.1](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.1) | 2026-08-20 | Fix packaged app: bundled server, shipped web UI, visible errors |
| [v0.1.0](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.0) | 2026-08-20 | Initial release: Core editor, agent loop, MCP, Skills, LSP, Git panel, Win/Mac/Linux/Docker |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes with tests
4. Run quality checks: `pnpm typecheck && pnpm lint && pnpm test`
5. Submit a PR with a clear description

---

## 🔒 Security

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities. For full transparency, [VULNERABILITIES.md](VULNERABILITIES.md) documents every known weakness, attack surface, and accepted design tradeoff — including prompt-injection risk and the unauthenticated server — before you discover them the hard way.

### Key Security Principles

- **No external network calls** unless you configure a remote provider/MCP
- **Shell commands are opt-in** (`allowShell: true` in config)
- **Protected paths** prevent the agent from touching sensitive files
- **Docker socket mount is opt-in** with explicit warnings

To report a security issue, email **security@wildfirebill.ai** or use [GitHub Security Advisories](https://github.com/wildfirebill-ai/localai-code-editor/security/advisories).

---

## 📄 License

[MIT License](LICENSE) — free to use, modify, and self-host.

---

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — The editor that powers VS Code
- [Model Context Protocol](https://modelcontextprotocol.io/) — For the MCP specification
- [Ollama](https://ollama.com/) — Making local LLMs accessible
- [Electron](https://www.electronjs.org/) — Cross-platform desktop apps
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript at scale

---

**Star ⭐ this repo if you find it useful!** It helps others discover LocalAI Code Editor.