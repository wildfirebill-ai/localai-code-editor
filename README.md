<h1 align="center">LocalAI Code Editor</h1>

<p align="center">
  <b>Free, open-source, self-hosted AI code editor powered by local LLMs</b><br>
  <sub>No cloud. No API keys. No telemetry. Your code stays on your machine.</sub>
</p>

<!-- SEO: LocalAI Code Editor is a free, open-source, self-hosted AI code editor that runs entirely offline using local LLMs like Ollama, LM Studio, and llama.cpp. It features an agentic AI assistant, MCP protocol support, agent skills marketplace, Docker-in-Docker sandbox, LSP IntelliSense, Monaco editor, git panel, and builds for Windows, macOS, Linux, Docker, and Unraid. -->

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-orange)](https://pnpm.io/)
[![Electron](https://img.shields.io/badge/Electron-43-9feaf9)](https://www.electronjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-v0.48-007ACC)](https://microsoft.github.io/monaco-editor/)
[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-purple)](https://modelcontextprotocol.io/)
[![Ollama](https://img.shields.io/badge/Ollama-Compatible-black)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-GHCR-blue)](https://ghcr.io/wildfirebill-ai/localai-code-editor)
[![Release](https://img.shields.io/github/v/release/wildfirebill-ai/localai-code-editor)](https://github.com/wildfirebill-ai/localai-code-editor/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/wildfirebill-ai/localai-code-editor/ci.yml?label=CI)](https://github.com/wildfirebill-ai/localai-code-editor/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

> **A free, open-source, self-hosted AI code editor powered entirely by your local LLM — no cloud, no API keys, no telemetry.**

**What is LocalAI Code Editor?** LocalAI Code Editor is a free, open-source, self-hosted AI code editor that runs entirely on your local machine. It connects to local LLMs — Ollama, LM Studio, llama.cpp, vLLM, or any OpenAI-compatible server — to provide an agentic AI coding assistant without sending your code to the cloud. Think VS Code + AI, but private.

**Key features:** Monaco Editor (same as VS Code), agentic AI that reads/writes files and runs commands, MCP protocol support for external tools, a marketplace of 50+ agent skills, Docker-in-Docker sandboxing, LSP IntelliSense, full git panel with blame, and builds for Windows, macOS, Linux, Docker, and Unraid.

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
| **MCP Client** | Connect local (stdio) and remote (HTTP/SSE) MCP servers; expose their tools to the agent |
| **Agent Skills** | 50+ built-in skills; project + user `SKILL.md` files with frontmatter; loaded on demand |
| **Skills Marketplace** | Installed/Discover tabs with 18 curated skills across 12 categories; one-click install |
| **Language Servers** | LSP-based completion, hover, diagnostics, definition, references, rename |
| **Git Panel** | Status, diff, stage/unstage, commit, branch manager, push/pull, log, blame annotations |
| **File Explorer** | Browse, open, edit, save — plus New File/Folder, Rename, and Delete from the sidebar |
| **Quick Open & Search** | Ctrl+P fuzzy file finder; workspace-wide text search with regex; @file mentions |
| **Monaco Editor** | The industry-standard editor used by VS Code, running locally |

<details>
<summary><b>View all 28 features…</b></summary>

| Category | Capabilities |
|----------|--------------|
| **Agent Task History** | View, replay, and branch from previous agent task trajectories |
| **Model Comparison** | Run the same prompt against multiple models side-by-side |
| **Agent System Prompt Tuning** | Preset templates, character count, expanded editor, template variables (`{{workspace}}`, `{{git_branch}}`, etc.) |
| **Approve-before-Apply** | Approve/deny per write+command via Agent panel toggle (diff-level review) |
| **Docker-in-Docker Sandbox** | Isolated Docker container for safe agent code execution — start/stop/exec via Settings |
| **Provider Setup UI** | Add, edit, test, and remove providers at runtime (Settings panel) — persisted per workspace |
| **Workspace Management** | Native folder picker on launch; switch projects anytime; live-rebinds git/skills/LSP |
| **MCP Server Discovery** | Curated registry of 15+ servers with search, category filter, and one-click install |
| **MCP Tool Discovery** | Searchable tool list grouped by server with expandable sections and descriptions |
| **Token Usage Dashboard** | Visual input/output breakdown, cost estimates, locale-formatted token counts |
| **Conversation Export** | Export chat history as Markdown or JSON for sharing and debugging |
| **Skill Auto-Application** | Workspace-aware skill suggestions based on project indicators and path heuristics |
| **Terminal Integration** | Run commands in an integrated terminal over WebSocket |
| **Code Formatting** | Format code with language-specific rules; auto-save with configurable delay |
| **Command Palette** | Quick access to all editor commands via Ctrl+Shift+P |
| **Settings Persistence** | Editor preferences saved to localStorage; workspace settings in `.localai/` |
| **Multi-tab Support** | Tab management utilities for multiple files |
| **Error Handling** | Structured error types and retry logic throughout |
| **Keyboard Shortcuts** | Reference for all editor commands with platform-specific keys |
| **File Change Tracking** | Track agent modifications to files with change types |
| **Editor Settings UI** | Auto-save toggle, minimap visibility, font size, word wrap controls |
| **Markdown Preview** | Toggle Edit/Preview for `.md` files |
| **Multi-Platform** | Windows, macOS, Linux (Electron), and any web-capable device (Docker) |

</details>

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

**50+ production-grade skills ship built-in** and work in every workspace — commit, test-and-fix, typecheck-fix, lint-clean, debug-failure, refactor-safe, docker-build-run, dependency-update, git-release, write-docs, security-check, and 40 more covering git, quality, testing, performance, frontend, backend, ops, and AI integration.

### Skills Marketplace

The **Skills** panel (🧠 icon) has two tabs:

- **Installed** — all loaded skills with enable/disable controls and workspace-aware suggestions
- **Discover** — browse 18 curated skills across 12 categories (git, backend, frontend, devops, testing, security, quality, docs, docker, ai-integration, performance, maintenance) with search and one-click install

### Custom Skills

Skills are Markdown files with frontmatter that teach the AI your conventions, workflows, and best practices. Drop a `SKILL.md` into either location:

- **Project skills:** `<workspace>/.localai/skills/<name>/SKILL.md` (overrides builtins)
- **User (global) skills:** `~/.localai/skills/<name>/SKILL.md`

```markdown
---
name: ts-check
description: Typecheck a package with pnpm typecheck before committing
category: quality
---
Run `pnpm typecheck` from the package root and fix any errors.
```

Project skills override same-named global skills. The agent loads them on demand via the `read_skill` tool.

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

### MCP Server Discovery

The **MCP Servers** panel has two tabs:

- **Installed** — connected servers with status indicators, tool counts, and a manual add form
- **Discover** — curated registry of 15+ servers (Filesystem, Git, GitHub, PostgreSQL, SQLite, Redis, Web Fetch, Brave Search, AWS, Kubernetes, Hugging Face, Memory, Sequential Thinking) with search, category filter, and one-click install

### MCP Tool Discovery

Connected tools are searchable and grouped by server in **Settings → Connected Tools**. Hover over any tool to see its description.

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
| Git panel + blame | v0.1–v0.2 | ✅ Done |
| Multi-platform (Win/Mac/Linux/Docker) | v0.1 | ✅ Done |
| Agent Skills Marketplace | v0.2 | ✅ Done |
| Docker-in-Docker Sandbox | v0.2 | ✅ Done |
| Agent System Prompt Tuning | v0.2 | ✅ Done |
| Skill Auto-Application | v0.2 | ✅ Done |
| Enhanced MCP Tool Discovery | v0.2 | ✅ Done |
| Editor Polish (themes, keybindings, navigation) | v0.3 | 📋 Planned |
| Collaboration & Scale (multi-user, sessions) | v0.4 | 📋 Planned |
| Extensibility Platform (plugins, extensions) | v0.5 | 📋 Planned |
| Stability & Polish (tests, a11y, i18n) | v1.0 | 📋 Planned |

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
| [v0.2.3](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.2.3) | 2026-08-25 | Git Stash, Interactive Commit Editor, Commit History Viewer, Branch Comparison |
| [v0.2.2](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.2.2) | 2026-08-25 | Prompt Variables, Chat Export, Tool Description Customization, Token Usage Dashboard |
| [v0.2.1](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.2.1) | 2026-08-25 | Skills Marketplace, Docker-in-Docker Sandbox, Prompt Tuning UI, Skill Suggestions, Enhanced Tool Discovery |
| [v0.2.0](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.2.0) | 2026-08-23 | MCP Discovery, Task History, Model Comparison, Terminal, Git Blame, Code Formatting, Settings UI |
| [v0.1.6](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.6) | 2026-08-22 | Electron 43 (clears flagged CVEs), Docker slimmed + hardened, automated vuln scanning |
| [v0.1.5](https://github.com/wildfirebill-ai/localai-code-editor/releases/tag/v0.1.5) | 2026-08-21 | Quick Open (Ctrl+P), file search, @file mentions, 51 builtin skills, md preview |
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

---

<!-- SEO Keywords: local AI code editor, open source AI editor, self-hosted code editor, offline AI coding, Ollama code editor, local LLM editor, MCP code editor, agent skills, AI code assistant, private code editor, no cloud code editor, local-first AI, Monaco editor AI, Electron AI editor, Docker code editor, Unraid code editor, TypeScript AI editor, React code editor, AI pair programming, local AI assistant, code editor with AI, open source developer tools, self-hosted developer tools -->