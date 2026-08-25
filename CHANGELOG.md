# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-23

### Added
- **Code Formatting** - format code with language-specific rules and instructions for AI agent
- **Auto-save** - automatically save files after configurable delay
- **Changes Panel** - show file modifications in sidebar with color coding

## [0.2.0] - 2026-08-23


### Added
- **MCP Server Discovery** - browse and install known MCP servers from a curated registry
- **Agent Task History** - record and display past agent runs with tool calls and file changes
- **Diff View** - view file changes with syntax highlighting
- **Search Across Files** - find text across workspace with regex support
- **Settings Persistence** - save/load editor preferences to localStorage
- **Multi-tab Support** - tab management utilities for multiple files
- **Error Handling** - structured error types and retry logic
- **Git Blame Annotations** - show who wrote each line with commit info
- **Command Palette** - quick access to all editor commands
- **Status Bar** - show workspace, provider, model, and editor state
- **Keyboard Shortcuts** - reference for all editor commands with platform-specific keys
- **File Change Tracking** - track agent modifications to files with change types
- **Terminal Integration** - run commands in integrated terminal via WebSocket
- **Model Comparison** - compare responses from multiple models side-by-side

## [0.1.9] - 2026-08-23

### Added
- **MCP Server Discovery** - curated registry of 15+ known MCP servers with search, category filtering, and one-click install
- **Cost tracking per agent run** - token usage and estimated cost shown after each run

### Changed
- MCP Servers panel now has "Installed" and "Discover" tabs

### Fixed
- MCP server type definitions: added argsDescription field to registry entries

## [0.1.8] - 2026-08-22

### Added
- **Agent instructions editor** - per-workspace system prompt (.localai/system.md) editable from Settings; applies to the next agent run
- **Token usage per agent run** - prompt/completion totals shown after each run, accumulated across tool iterations
- **Language server management UI** - add/remove/monitor LSP servers from Settings; persists per workspace and takes effect immediately

### Changed
- Docker image hardened further: apk upgrade at build time, dependency-free server bundle instead of full node_modules, bundled npm removed. Image scans clean (0 findings)
- Security-scan reliability: chained off Docker completion via workflow_run, GHCR propagation wait, publish gated on scan success

## [0.1.7] - 2026-08-22

### Fixed
- Docker image scanning: pinned trivy-action to a working version, added pull retry logic
- Security-scan publish: only publish when both scans succeed
- Added 3-minute GHCR propagation wait for chained scans

## [0.1.6] - 2026-08-22

### Changed
- Electron upgraded 33 → 43.4.1 and electron-builder 25 → 26.15.3
- Clears Electron use-after-free / context-isolation-bypass HIGH CVEs
- Docker image hardened: apk upgrade, dependency-free server bundle, npm removed

### Fixed
- Docker image: cleared 317+ HIGH vulnerability findings by removing node_modules and npm
- Security-scan workflow: fixed race condition with image pushes via workflow_run chaining

## [0.1.5] - 2026-08-21

### Added
- Quick Open (Ctrl+P) - fuzzy file finder across workspace
- Search panel - workspace-wide text search grouped by file
- @file mentions - type @ in agent prompt to attach file contents as context
- 51 built-in agent skills (git, quality, testing, frontend, backend, ops)
- Sampling controls - temperature / max-tokens per request, persisted
- Markdown preview toggle for .md files
- Recent workspaces list in Settings panel
- Run-completed notification - system notification + title flash
- Explorer auto-expand to the file open in the editor
- VULNERABILITIES.md - public security transparency document
- Security scan workflow - automated dependency + image vulnerability scanning

## [0.1.4] - 2026-08-21

### Added
- Workspace picker (native dialog on first launch, switch anytime)
- Explorer file operations: New File, New Folder, Rename, Delete
- Runtime workspace switching via Settings panel

### Fixed
- Desktop installer: hidden workspace picker in first launch

## [0.1.3] - 2026-08-21

### Added
- LLM provider connection settings UI - add/edit/test/remove at runtime
- Provider health check with latency display
- Persistence via localai/settings.json

## [0.1.2] - 2026-08-21

### Fixed
- Windows install: "AssignProcessToJobObject" crash — uses ELECTRON_RUN_AS_NODE
- EPIPE crash dialog in packaged GUI apps
- electron-builder auto-update metadata generation

## [0.1.1] - 2026-08-20

### Fixed
- Packaged app: bundled server as single file, shipped web UI as resource
- Startup errors now surface in a native error dialog

## [0.1.0] - 2026-08-20

### Added
- Core editor with Monaco, file explorer, and workspace support
- AI agent loop with tool execution and streaming responses
- MCP (Model Context Protocol) support - local stdio + remote HTTP/SSE
- Agent skills system with project and user skill loading
- Language Server Protocol (LSP) for IntelliSense
- Git panel with status, diff, stage/unstage, commit, branches
- Multi-platform builds: Windows, macOS, Linux (Electron), Docker
- Configuration system (localai.config.json)