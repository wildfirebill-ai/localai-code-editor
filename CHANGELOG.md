# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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