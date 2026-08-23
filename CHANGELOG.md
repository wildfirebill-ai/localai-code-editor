# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2026-08-22

### Added
- **Agent instructions editor** - per-workspace system prompt (.localai/system.md) editable from Settings; applies to the next agent run.
- **Token usage per agent run** - prompt/completion totals shown after each run, accumulated across tool iterations.
- **Language server management UI** - add/remove/monitor LSP servers from Settings; persists per workspace and takes effect immediately.

### Changed
- Docker image hardened further: apk upgrade at build time, dependency-free server bundle instead of full node_modules, bundled npm removed. Image scans clean (0 findings).
- Security-scan reliability: chained off Docker completion via workflow_run, GHCR propagation wait, publish gated on scan success.

## [0.1.7]

### Added
- **Approve-before-apply mode (guardrails)** - toggle "approve edits" in the Agent panel; every file write and shell command pauses with an Approve/Deny card showing exactly what will run. Denied actions tell the agent to stop retrying; read-only tools pass through ungated. Verified end-to-end.

### Fixed
- Explorer `prompt()` replaced with inline inputs (Electron does not support window.prompt).

### Changed
- **Docker image hardened and slimmed** - OS packages upgraded at build time (`apk upgrade`); the container now runs the single-file server bundle instead of the full workspace `node_modules` (which carried desktop devDeps like the electron-builder tree); bundled npm and its vendored vulnerable deps (tar, sigstore, brace-expansion, picomatch) removed since the runtime never uses npm.

### Fixed
- Security-scan workflow reliability: waits out GHCR CDN tag-propagation after image overwrites; publish job only runs when both scans succeed; trivy-action pinned to an existing version.

## [0.1.5] - 2026-08-21

### Added
- **Quick Open (Ctrl+P)** - fuzzy file finder across the whole workspace.
- **Search panel** - case-insensitive text search across all files, grouped by file, click to open.
- **`@file` mentions in prompts** - type `@` for a file autocomplete; mentioned files are attached as context for the agent.
- **Built-in global skills** - 51 real skills ship with the editor and work in every workspace: git (commit, branch-cleanup, pr-prep, code-review-fix, rebase-conflicts, hotfix, git-release), quality (test-and-fix, typecheck-fix, lint-clean, debug-failure, refactor-safe, dead-code-remove, todo-sweep, error-handling-pass, types-strictify, naming-cleanup), testing (unit-test-write, e2e-test-write, coverage-gap, regression-repro), performance (perf-profile, bundle-shrink, memory-leak), frontend (component-extract, css-debug, accessibility-fix, responsive-fix, xss-fix), backend/API (api-endpoint-add, db-migration, sql-optimize, auth-flow-audit, rate-limiting-add, webhook-handler, queue-consumer), docs (write-docs, changelog-update, adr-write, readme-quickstart), ops (ci-fix, env-setup, docker-compose-debug, log-triage, docker-build-run, dependency-update, secrets-rotate), AI integration (mcp-server-scaffold, prompt-improve, skill-author). Project/user skills still override same-named builtins.
- **Sampling controls** - temperature / max-tokens per request (gear icon in the Agent panel), persisted.
- **Markdown preview** - toggle Edit/Preview for `.md` files.
- **Recent workspaces** - last 8 workspaces listed in Settings > Workspace.
- **Run-completed notification** - system notification + title flash when an agent run finishes in an unfocused window.
- **Explorer auto-expand** - the tree expands to the file open in the editor.
- New server RPC: `fs.allFiles`, `fs.search`. Agent loop now supports `temperature`/`maxTokens`; per-workspace `.localai/system.md` is appended to the agent's system prompt.
- **VULNERABILITIES.md** - public transparency document listing every known weakness, attack surface, and accepted design tradeoff with scenarios, mitigations, and a user hardening checklist.
- **Security scan workflow** (`security-scan.yml`) - runs on every release, weekly schedule, and manual dispatch. Scans repository dependencies (pnpm audit + Trivy fs: vulns/misconfig/secrets) and the published Docker image (Trivy, HIGH/CRITICAL), then publishes results into an auto-generated section at the end of VULNERABILITIES.md.
- Docker images now also publish a `latest` tag on release.

### Fixed
- **Explorer: `prompt() is not supported`** - window.prompt is unsupported in Electron; new-file/new-folder/rename now use inline input rows (Enter commits, Esc cancels).

## [0.1.4] - 2026-08-21

### Added
- **Workspace management** - the desktop app now asks which folder to open on first launch (native picker) instead of silently defaulting to Documents. The Settings panel shows the active workspace and lets you switch anytime via "Open Folder…" (desktop) or by typing an absolute path (works in browser/Docker too). Switching live-rebinds the file tools, git panel, skills, and language servers.
- **Explorer file operations** - New File, New Folder, Rename, and Delete in the sidebar (click a folder to target it; right-click to select for rename/delete), with duplicate/traversal/root-delete guards. New files open immediately in the editor.
- New server RPC: `fs.createFile`, `fs.createDir`, `fs.rename`, `fs.delete`, `workspace.get`, `workspace.set`.
- Desktop preload bridge (`window.localai.pickWorkspace()` / `getWorkspace()`) for native folder picking.

## [0.1.3] - 2026-08-21

### Added
- **LLM provider connection settings in the UI** — the Settings panel now lists every provider with live health/latency, and lets you add, edit (label / base URL / API key), test, and remove providers at runtime. Presets for Ollama, LM Studio, llama.cpp, and vLLM; custom OpenAI-compatible endpoints supported. Settings persist to `<workspace>/.localai/settings.json` and survive restarts in dev, desktop, and Docker.
- New server RPC: `providers.upsert`, `providers.remove`, `providers.test` (probe an endpoint without registering it).

## [0.1.2] - 2026-08-21

### Fixed
- **Windows install: "AssignProcessToJobObject" crash at startup.** The Electron main process spawned a second full Electron instance for the backend, which fails in installed apps (job-object restriction). The backend now spawns with `ELECTRON_RUN_AS_NODE=1` so the Electron binary runs in plain Node mode.
- **EPIPE crash dialog on Windows** — packaged GUI apps have no valid stdout; all server-output logging is now guarded and stream errors are swallowed.
- **`[server]` blank-line spam** in logs/diagnostics — empty output lines are filtered.
- **electron-builder could not generate auto-update metadata** ("Cannot detect repository") — `repository` field added to the desktop package.

### Verified
- Packaged exe smoke-tested locally on Windows: process stays alive and the backend serves the UI on `127.0.0.1:4801`.

## [0.1.1] - 2026-08-20

### Fixed
- **Desktop installers now launch correctly on Windows/macOS/Linux.** The packaged app previously exited silently after ~15s because:
  - The bundled server had no `node_modules` next to it (`ws`, `simple-git`, workspace packages missing) — the server is now bundled into a single dependency-free `index.cjs` with esbuild
  - The server looked for the web UI at a source-tree-relative path that does not exist in packaged apps — the UI is now shipped as an extraResource and located via `LOCALAI_WEB_DIST` (with packaged/dev fallbacks)
  - Startup failures were only logged to an invisible console — errors now surface in a native error dialog with server output tail

### Added
- SEO-optimized README with comprehensive documentation
- Topics/keywords for discoverability
- CHANGELOG.md (this file)
- ROADMAP.md with detailed milestones
- CONTRIBUTING.md with contribution guidelines
- SECURITY.md with security policy
- CODE_OF_CONDUCT.md
- Example skill files in `.localai/skills/`
- Updated CI workflows to only run on release tags

### Changed
- CI/CD workflows now only trigger on version tags (`v*`) and manual dispatch
- Desktop `dist*` scripts are self-contained: they build all packages + the server bundle before electron-builder runs
- Desktop artifact globs fixed to exclude unpacked files (win-unpacked, etc.)
- Linux artifact globs now include deb/tar.gz from `@localai/` subdirectory
- Updated all GitHub Actions to latest major versions (Node 24 runtimes)
- Softprops/action-gh-release updated to v3 for Node 24 compatibility

### Fixed (CI)
- Docker build: `pnpm-lock.yaml` now copied for `pnpm install --frozen-lockfile`
- Linux deb/tar.gz artifacts now included in releases
- Windows spurious artifacts (elevate.exe, LocalAI.Code.Editor.exe) excluded
- Release workflow now only downloads desktop artifacts (not web builds)

## [0.1.0] - 2026-08-20

### Added
- **Core Editor**: Monaco-based code editor with file explorer, tabs, and workspace management
- **AI Agent Loop**: Streaming chat with file read/write, shell commands, MCP tool calls, and iterative task completion
- **MCP Support**: Full Model Context Protocol client — local (stdio) and remote (HTTP/SSE) servers
- **Agent Skills**: Project and global `SKILL.md` files with frontmatter, loaded on demand
- **Language Server Protocol**: LSP host for completion, hover, diagnostics, definitions, references, rename
- **Git Panel**: Status, diff, stage/unstage, commit, branch manager, push/pull, log
- **Multi-Platform Builds**:
  - Windows: NSIS installer (`.exe`) + portable zip
  - macOS: DMG + zip (Apple Silicon/ARM64)
  - Linux: AppImage + deb + tar.gz
  - Docker: Multi-arch (amd64/arm64) image to GHCR
- **Configuration System**: `localai.config.json` with providers, MCP servers, LSP servers, protected paths
- **Web UI**: Monaco editor, file explorer, agent chat, git panel, MCP panel, skills panel
- **Desktop Shell**: Electron 33 wrapper with auto-updater support

### Changed
- Initial project structure with monorepo (pnpm workspaces)
- TypeScript strict mode across all packages

### Security
- Shell commands opt-in via `allowShell` config
- Protected paths prevent agent access to `.git`, `.env`, etc.
- Docker socket mount explicitly documented with warnings
- No telemetry, no external calls without user configuration

---

## Release Template

When creating a new release, use this template:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature descriptions with links to PRs

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be-removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```