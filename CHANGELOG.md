# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.7] - 2026-08-26

### Added
- **Theme Switcher** — light, dark, high-contrast, and system themes in Settings
- **Release Notes in-app** — view release notes in a modal instead of opening browser
- **Skill Versioning** — track skill versions with semver in frontmatter (default: 1.0.0)
- **Skill Search in Agent** — `skills.search` RPC for agent to find skills by keyword

### Changed
- Settings panel now shows theme selector dropdown
- Skills panel shows version number next to each skill
- Update checker shows release notes in a modal with "Open on GitHub" link

## [0.2.6] - 2026-08-26 (includes v0.2.4 + v0.2.5)

### Added
- **Find & Replace** — Ctrl+H panel with regex, case-sensitive, whole-word options, replace one or all
- **MCP Auto-reconnect** — reconnect disconnected servers with exponential backoff
- **MCP Health Check** — check all MCP server connections and mark disconnected ones
- **MCP Tool Call Retry** — retry failed tool calls with backoff and auto-reconnect
- **MCP Server Logs** — view per-server connection and error logs
- **MCP Config Export** — export MCP server configs as JSON for sharing
- **Debug Console** — real-time log viewer with level/source filtering, server info panel, and auto-refresh
- **Debug Logger** — server-side ring buffer capturing console output, uncaught exceptions, and startup events
- **Debug RPCs** — `debug.logs` (filtered log entries) and `debug.info` (server uptime, memory, PID)
- **Bracket Matching & Auto-close** — auto-close brackets, parens, quotes with colorized pair highlighting
- **Multi-cursor Editing** — Ctrl+D selects next occurrence, Alt+Click adds cursor
- **Code Folding** — indentation-based folding with hover controls and highlight
- **File Encoding Detection** — show file encoding in editor tab
- **Breadcrumbs** — enabled by default in Monaco editor

### Fixed
- File explorer skips symlinks to prevent doubled paths (e.g., `android/android/app`)
- Server captures uncaught exceptions and unhandled rejections in debug log

## [0.2.3] - 2026-08-25

### Added
- **Git Stash** — stash, pop, list, and drop from the Git panel with optional message
- **Interactive Commit Editor** — modal editor for commit messages with character count
- **Commit History Viewer** — browse log with author, date, and inline diff preview per commit
- **Branch Comparison** — select two branches and diff them side-by-side in the Branches tab

### Fixed
- File explorer now skips `.dart_tool`, `Pods`, `.gradle` directories to prevent symlink recursion errors

## [0.2.2] - 2026-08-25

### Added
- **Custom System Prompt Variables** — template variables in system prompt: `{{workspace}}`, `{{git_branch}}`, `{{date}}`, `{{time}}`, `{{weekday}}`
- **Agent Conversation Export** — export chat history as Markdown or JSON with download button in the Agent panel
- **Tool Description Customization** — edit MCP tool descriptions per workspace in Settings; overrides what the agent sees
- **Agent Token Usage Dashboard** — visual input/output bar with cost estimate, locale-formatted token counts
- **Update Checker** — check GitHub releases API for new versions with one-click "Check now" button
- **Auto-update Schedule** — configurable checkbox for startup update checks, persisted in localStorage
- **Agent Memory** — persistent notes in `.localai/memory/` with categories (General, Build, Config, Findings, Decisions); agent reads these for context during runs

### Changed
- Settings panel shows variable reference hints in the Agent Instructions section
- Connected Tools section now includes editable tool descriptions below the grouped list
- Settings panel now has Updates and Agent Memory sections

## [0.2.1] - 2026-08-25

### Added
- **Agent Skills Marketplace** — Installed/Discover tabs with 18 curated skills across 12 categories, one-click install/uninstall, category filter and search
- **Docker-in-Docker Sandbox** — isolated Docker container for safe agent code execution with start/stop/exec controls, network-isolated by default
- **Agent System Prompt Tuning UI** — preset templates (Code Assistant, Security Reviewer, DevOps Helper, Refactor Expert), character count, expanded editor
- **Skill Auto-Application** — workspace-aware skill suggestions based on project indicators (package.json, Dockerfile, etc.) and path heuristics
- **Enhanced MCP Tool Discovery** — searchable tool list grouped by server with expandable sections and description previews
- **Skill categories** — all builtin skills now include category metadata in frontmatter

### Changed
- Skills panel now has Installed/Discover tabs matching MCP Discover UX pattern
- Agent instructions editor expanded with preset templates and char count
- MCP Connected Tools section replaced with searchable, grouped tool browser
- CI workflow: upgraded `actions/checkout` to v5, added explicit permissions to desktop job

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
- **Code Formatting** - format code with language-specific rules and instructions for AI agent
- **Auto-save** - automatically save files after configurable delay
- **Changes Panel** - show file modifications in sidebar with color coding
- **Editor Settings UI** - auto-save toggle, minimap visibility, font size, word wrap
- **Keyboard Shortcuts** - reference for all editor commands
- **Git Blame Annotations** - show who wrote each line

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