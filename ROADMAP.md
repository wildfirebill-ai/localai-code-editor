# Roadmap

This roadmap outlines the planned features and improvements for LocalAI Code Editor. It is a living document — priorities may shift based on community feedback and contributor interest.

## 🎯 Vision

Build the **best local-first AI code editor** that respects your privacy, works offline, and integrates seamlessly with your existing local LLM infrastructure.

---

## 📅 Milestones

### v0.1.0 — Foundation ✅ (Released 2026-08-20)
- [x] Core editor with Monaco
- [x] AI agent loop (file ops, shell, MCP)
- [x] MCP client (stdio + HTTP/SSE)
- [x] Agent skills system
- [x] LSP IntelliSense
- [x] Git panel
- [x] Win/Mac/Linux/Docker builds
- [x] Configuration system

---

### v0.2.0 — Agent Power-Ups ✅ (Released 2026-08-23)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Approve-before-apply mode** | Approve/deny per write+command via Agent panel toggle (diff-level review planned). | High | ✅ Done (v0.1.x) |
| **MCP Server Discovery** | Curated registry of 15+ known MCP servers with search, category filtering, and one-click install. | High | ✅ Done (v0.2.0) |
| **Agent Task History** | View, replay, and branch from previous agent task trajectories. | Medium | ✅ Done (v0.2.0) |
| **Model Comparison** | Run same prompt against multiple models side-by-side. | Medium | ✅ Done (v0.2.0) |
| **Code Formatting / Auto-save** | Format code with language-specific rules; auto-save with configurable delay. | Medium | ✅ Done (v0.2.0) |
| **Terminal Integration** | Run commands in an integrated terminal over WebSocket. | Medium | ✅ Done (v0.2.0) |
| **Git Blame Annotations** | Show who wrote each line and when. | Low | ✅ Done (v0.2.0) |

### v0.2.1 — Marketplace & Sandbox ✅ (Released 2026-08-25)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Agent Skills Marketplace** | Installed/Discover tabs, 18 curated skills, one-click install/uninstall, category filter + search. | High | ✅ Done (v0.2.1) |
| **Docker-in-Docker Sandbox** | Isolated Docker container for agent code execution — start/stop/exec via Settings, network-isolated. | High | ✅ Done (v0.2.1) |
| **Agent System Prompt Tuning UI** | Preset templates (Code Assistant, Security Reviewer, DevOps, Refactor), character count, expanded editor. | Medium | ✅ Done (v0.2.1) |
| **Skill Auto-Application** | Workspace-aware skill suggestions based on project indicators and path heuristics. | Medium | ✅ Done (v0.2.1) |
| **Enhanced MCP Tool Discovery** | Searchable tool list, grouped by server with expandable sections, description previews. | Medium | ✅ Done (v0.2.1) |

### v0.2.2 — Agent Improvements ✅ (Released 2026-08-25)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Custom System Prompt Variables** | Template variables in system prompt: `{{workspace}}`, `{{git_branch}}`, `{{date}}`, `{{time}}`, `{{weekday}}`. | Medium | ✅ Done (v0.2.2) |
| **Agent Conversation Export** | Export chat history as Markdown or JSON with download button. | Medium | ✅ Done (v0.2.2) |
| **Tool Description Customization** | Edit MCP tool descriptions in Settings; saved per workspace. | Low | ✅ Done (v0.2.2) |
| **Agent Token Usage Dashboard** | Visual breakdown with input/output bar, cost estimate, and locale-formatted counts. | Medium | ✅ Done (v0.2.2) |

### v0.2.3 — Git Enhancements ✅ (Released 2026-08-25)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Stash Support** | Stash, pop, list, and drop from the Git panel with message support. | High | ✅ Done (v0.2.3) |
| **Interactive Commit Editor** | Modal editor for commit messages with char count and preview. | Medium | ✅ Done (v0.2.3) |
| **Commit History Viewer** | Browse log with author, date, and inline diff preview per commit. | Medium | ✅ Done (v0.2.3) |
| **Branch Comparison** | Select two branches and diff them side-by-side in the Branches tab. | Low | ✅ Done (v0.2.3) |

### v0.2.6 — Editor + Debug + MCP Resilience ✅ (Released 2026-08-26)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Find & Replace** | Ctrl+H panel with regex, case-sensitive, whole-word, replace one/all. | High | ✅ Done (v0.2.6) |
| **Debug Console** | Real-time log viewer with level/source filtering, server info, auto-refresh. | High | ✅ Done (v0.2.6) |
| **Bracket Matching & Auto-close** | Auto-close brackets, parens, quotes with colorized pair highlighting. | High | ✅ Done (v0.2.6) |
| **Multi-cursor Editing** | Ctrl+D selects next occurrence, Alt+Click adds cursor. | High | ✅ Done (v0.2.6) |
| **Code Folding** | Indentation-based folding with hover controls and highlight. | Medium | ✅ Done (v0.2.6) |
| **MCP Auto-reconnect** | Reconnect disconnected servers with exponential backoff. | High | ✅ Done (v0.2.6) |
| **MCP Health Check** | Health check all MCP servers, mark disconnected ones. | Medium | ✅ Done (v0.2.6) |
| **MCP Tool Call Retry** | Retry failed tool calls with backoff and auto-reconnect. | Medium | ✅ Done (v0.2.6) |
| **MCP Server Logs** | View per-server logs from the MCP host. | Low | ✅ Done (v0.2.6) |
| **MCP Config Export** | Export MCP server configs as JSON for sharing. | Low | ✅ Done (v0.2.6) |
| **File Encoding Detection** | Show file encoding in editor tab (UTF-8 default). | Low | ✅ Done (v0.2.6) |
| **Breadcrumbs** | Enabled by default in Monaco editor. | Low | ✅ Done (v0.2.6) |

### v0.2.6 — Skills + Theme Switcher

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Theme Switcher** | Light, dark, and high-contrast themes with quick toggle. | High | 📋 Planned |
| **Skill Versioning** | Track skill versions with semver in frontmatter. | Medium | 📋 Planned |
| **Skill Dependencies** | Declare dependencies between skills (e.g., security-check needs auth-flow-audit). | Low | 📋 Planned |
| **Skill Search in Agent** | Let the agent search for skills by keyword before activating. | Medium | 📋 Planned |
| **Skill Usage Analytics** | Track which skills are used most frequently per workspace. | Low | 📋 Planned |

### v0.2.7 — Docker + Terminal in Editor

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Terminal in Editor** | Embedded terminal panel with PTY support and split view. | High | 📋 Planned |
| **Docker Compose Integration** | Generate/manage docker-compose.yml from the editor. | Medium | 📋 Planned |
| **Container Logs Viewer** | View logs from running Docker containers in a panel. | Medium | 📋 Planned |
| **Volume Mount Config** | Configure Docker volume mounts from Settings UI. | Low | 📋 Planned |
| **Image Layer Inspector** | View Docker image layers and sizes for optimization. | Low | 📋 Planned |

### v0.2.8 — Performance + Status Bar

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Cursor Position in Status Bar** | Show `Ln X, Col Y` in the status bar. | High | 📋 Planned |
| **Word Wrap Quick Toggle** | Click in status bar to cycle wrap modes. | Medium | 📋 Planned |
| **Undo/Redo Buttons** | Visual undo/redo in status bar. | Low | 📋 Planned |
| **Minimap Quick Toggle** | Click in status bar to toggle minimap. | Low | 📋 Planned |
| **Lazy File Loading** | Only load visible editor content; lazy-load large files. | High | 📋 Planned |
| **Web Worker Offloading** | Move heavy processing (linting, search) to web workers. | Medium | 📋 Planned |
| **Virtual File Tree** | Virtualize the file explorer for workspaces with 10K+ files. | Medium | 📋 Planned |
| **Bundle Analysis** | Built-in bundle size analysis and tree-shaking recommendations. | Low | 📋 Planned |
| **Memory Usage Monitor** | Show editor and server memory usage in the status bar. | Low | 📋 Planned |

### v0.2.9 — UX Polish + Split Editor

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Split Editor** | Side-by-side file editing with independent cursors. | High | 📋 Planned |
| **File Diff View** | Compare two files side-by-side with inline diff. | Medium | 📋 Planned |
| **Auto-format on Save** | Run formatter automatically when saving files. | Medium | 📋 Planned |
| **Recent Files** | Quick access to recently opened files. | Medium | 📋 Planned |
| **Keyboard Shortcuts Reference** | Overlay showing all available shortcuts by category. | Medium | 📋 Planned |
| **Onboarding Wizard** | First-run setup guide: pick workspace, connect LLM, enable skills. | Medium | 📋 Planned |
| **Tooltips on Hover** | Contextual tooltips for all buttons and controls. | Low | 📋 Planned |
| **Empty State Illustrations** | Friendly empty states for chat, explorer, git, and settings panels. | Low | 📋 Planned |
| **Notification Center** | Collapsible notification panel for agent completions, errors, updates. | Low | 📋 Planned |

---

### v0.3.0 — Editor Polish 🎨 (Q1 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Multi-Tab Editing** | Multiple file tabs with split views | High | ✅ Done (v0.2.0) |
| **File Diff View** | Inline and side-by-side diff for git changes and agent edits | High | ✅ Done (v0.2.0) |
| **Search Across Files** | Workspace-wide text search with regex support | High | ✅ Done (v0.2.0) |
| **Advanced Git Operations** | Interactive rebase, cherry-pick, stash, submodule support | Medium | ⬜ Planned |
| **Workspace Symbols** | Go-to-symbol across workspace (LSP-powered) | Medium | ⬜ Planned |
| **Refactoring Actions** | Extract function, rename, move file (LSP code actions) | Medium | ⬜ Planned |
| **Agent Cost History** | Track cumulative token cost across runs with per-run breakdown. | Medium | 📋 Planned |
| **Agent Run Replay** | Replay a previous agent run step-by-step for debugging. | Medium | 📋 Planned |
| **Agent Context Window** | Show how much context the agent has used vs. model limit. | Medium | 📋 Planned |
| **Custom Keybindings** | User-configurable keyboard shortcuts | Low | ✅ Done (v0.2.0) |
| **Theme Customization** | Custom color themes, font ligatures, editor settings UI | Low | ✅ Done (v0.2.0) |

### v0.3.1 — Advanced Git

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Interactive Rebase UI** | Visual rebase editor with drag-to-reorder commits. | Medium | 📋 Planned |
| **Cherry-pick** | Cherry-pick commits across branches from the Git panel. | Medium | 📋 Planned |
| **Submodule Support** | Init, update, and manage Git submodules. | Low | 📋 Planned |
| **Git Tags Manager** | Create, delete, and annotate tags from the Git panel. | Low | 📋 Planned |

### v0.3.2 — Workspace Navigation

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Go to Symbol** | Ctrl+Shift+O to list all symbols in current file. | High | 📋 Planned |
| **Go to Definition** | Ctrl+Click to jump to symbol definition (LSP). | High | 📋 Planned |
| **Find All References** | Shift+F12 to find all usages of a symbol. | Medium | 📋 Planned |
| **Outline Panel** | Tree view of symbols in the current file. | Medium | 📋 Planned |
| **Call Hierarchy** | View callers and callees of a function. | Low | 📋 Planned |

### v0.3.3 — Code Actions

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Quick Fix** | Ctrl+. to apply LSP-suggested fixes (missing import, type error). | High | 📋 Planned |
| **Extract Function** | Select code → extract into a new function. | Medium | 📋 Planned |
| **Rename Symbol** | F2 to rename across all files (LSP). | High | 📋 Planned |
| **Organize Imports** | Remove unused imports, sort imports alphabetically. | Medium | 📋 Planned |
| **Code Actions on Save** | Auto-organize imports, fix all on save. | Low | 📋 Planned |

### v0.3.4 — Editor View Modes

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Split Editor** | Split editor vertically or horizontally. | Medium | 📋 Planned |
| **Side-by-side Diff** | Dedicated diff view with inline + side-by-side toggle. | Medium | 📋 Planned |
| **Zen Mode** | Distraction-free editing with hidden UI elements. | Low | 📋 Planned |
| **Word Wrap Toggle** | Per-file word wrap setting (not global). | Low | 📋 Planned |

### v0.3.5 — Theme System

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Theme Selector** | Built-in light, dark, and high-contrast themes. | High | 📋 Planned |
| **Theme Import** | Import VS Code .json color themes. | Medium | 📋 Planned |
| **Accent Color** | User-configurable accent color for UI highlights. | Low | 📋 Planned |
| **Font Ligatures** | Toggle font ligatures (Fira Code, JetBrains Mono). | Low | 📋 Planned |

### v0.3.6 — Custom Keybindings

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Keybinding Editor** | Visual UI to view and edit keyboard shortcuts. | Medium | 📋 Planned |
| **Keybinding Import/Export** | Export/import keybinding configs as JSON. | Low | 📋 Planned |
| **When Clauses** | Conditional keybindings (only active in editor, terminal, etc.). | Low | 📋 Planned |

### v0.3.7 — Command Palette Enhancements

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Recent Commands** | Show recently used commands at the top. | Medium | 📋 Planned |
| **Command Categories** | Group commands by category in the palette. | Low | 📋 Planned |
| **Fuzzy Matching Improvements** | Better fuzzy matching with typo tolerance. | Low | 📋 Planned |
| **Keyboard-Only Navigation** | Full keyboard navigation in the command palette. | Medium | 📋 Planned |

### v0.3.8 — Status Bar Enhancements

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Line/Column Indicator** | Current cursor position (line:column). | High | 📋 Planned |
| **Language Indicator** | Show detected language with click to change. | Medium | 📋 Planned |
| **Encoding Indicator** | Show file encoding with click to change. | Low | 📋 Planned |
| **Indentation Indicator** | Show and change indentation (spaces/tabs, width). | Low | 📋 Planned |
| **Connection Status** | Show server and MCP connection health. | Medium | 📋 Planned |

### v0.3.9 — Polish & Bug Fixes

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Responsive Layout** | Better layout on narrow screens and tablets. | Medium | 📋 Planned |
| **Error Recovery** | Graceful recovery from server crashes and network issues. | High | 📋 Planned |
| **Undo/Redo Persistence** | Persist undo stack across file saves. | Medium | 📋 Planned |
| **Improved Accessibility** | Keyboard navigation for all panels, ARIA labels. | High | 📋 Planned |
| **Performance Profiling** | Built-in profiler to diagnose slow operations. | Low | 📋 Planned |

---

### v0.4.0 — Collaboration & Scale 👥 (Q2 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Remote Collaboration** | Multi-user editing with presence, cursors, and shared agent sessions | High | 📋 Planned |
| **Session Sharing** | Share a live coding session with a colleague via link | Medium | 📋 Planned |
| **Team Skills Registry** | Private skill registry for organizations | Medium | 📋 Planned |
| **Agent Session Recording** | Record and share agent task sessions for review/debugging | Medium | 📋 Planned |
| **Project Templates** | Starter templates with pre-configured skills, LSPs, MCP | Low | 📋 Planned |

### v0.4.1 — Real-time Collaboration

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Presence Indicators** | Show connected users with colored cursors and selections. | High | 📋 Planned |
| **Conflict Resolution** | CRDT-based conflict resolution for simultaneous edits. | High | 📋 Planned |
| **Chat in Session** | Text chat alongside collaborative editing. | Medium | 📋 Planned |

### v0.4.2 — Session Management

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Session Links** | Generate shareable links for live coding sessions. | High | 📋 Planned |
| **Session Passwords** | Protect shared sessions with passwords. | Medium | 📋 Planned |
| **Session History** | Browse and resume past collaborative sessions. | Low | 📋 Planned |

### v0.4.3 — Team Features

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Team Skills Registry** | Host a private skill registry for your organization. | Medium | 📋 Planned |
| **Shared MCP Configs** | Share MCP server configurations across a team. | Medium | 📋 Planned |
| **Role-based Access** | Control who can edit, review, or just view. | Low | 📋 Planned |

### v0.4.4 — Agent Recording

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Session Recording** | Record all agent interactions (prompts, tool calls, results). | Medium | 📋 Planned |
| **Playback** | Replay recorded sessions step-by-step. | Medium | 📋 Planned |
| **Export Recordings** | Export as JSON or Markdown for sharing. | Low | 📋 Planned |

### v0.4.5 — Project Templates

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Template Gallery** | Browse built-in templates (React, Node, Python, Go, Rust). | Medium | 📋 Planned |
| **Custom Templates** | Create and share custom project templates. | Low | 📋 Planned |
| **Template Variables** | Variable substitution in templates (project name, author, etc.). | Low | 📋 Planned |

### v0.4.6 — Performance at Scale

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **WebSocket Pooling** | Connection pooling for multiple concurrent users. | Medium | 📋 Planned |
| **Server Clustering** | Run multiple server instances behind a load balancer. | Medium | 📋 Planned |
| **Asset Caching** | CDN-friendly caching for static assets. | Low | 📋 Planned |

### v0.4.7 — Monitoring & Analytics

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Session Metrics** | Track active sessions, response times, error rates. | Medium | 📋 Planned |
| **Usage Analytics** | Anonymous usage tracking for improvement insights. | Low | 📋 Planned |
| **Health Dashboard** | Server health and resource usage dashboard. | Low | 📋 Planned |

### v0.4.8 — Security Hardening

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Session Tokens** | Secure session tokens for collaborative sessions. | High | 📋 Planned |
| **Rate Limiting** | Rate limit API calls per user/session. | Medium | 📋 Planned |
| **Input Sanitization** | Sanitize all user inputs across the application. | High | 📋 Planned |
| **CSP Headers** | Content Security Policy headers for the web UI. | Medium | 📋 Planned |

### v0.4.9 — Documentation & Onboarding

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Interactive Tutorial** | In-app tutorial for new users. | Medium | 📋 Planned |
| **Video Walkthroughs** | Embedded video guides for key features. | Low | 📋 Planned |
| **API Reference** | Auto-generated API docs from RPC methods. | Medium | 📋 Planned |

---

### v0.5.0 — Extensibility Platform 🔌 (Q3 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Plugin/Extension API** | Official API for third-party extensions (UI, tools, language support) | High | 📋 Planned |
| **Extension Marketplace** | Browse, install, and manage extensions from the editor | Medium | 📋 Planned |
| **Custom Agent Tools** | Define custom tools via config/skills without code changes | Medium | 📋 Planned |
| **Webview API** | Embed custom webviews in the editor (like VS Code) | Low | 📋 Planned |

### v0.5.1 — Plugin API Core

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Extension Manifest** | Package format for extensions (package.json with activation hooks). | High | 📋 Planned |
| **Extension Host** | Sandboxed execution environment for extensions. | High | 📋 Planned |
| **API Surface** | Documented API for editor, sidebar, terminal, and agent access. | High | 📋 Planned |
| **Extension Lifecycle** | Activate, deactivate, and dispose extensions properly. | Medium | 📋 Planned |

### v0.5.2 — Extension Discovery

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Extension Marketplace UI** | Browse, search, and install extensions from the editor. | High | 📋 Planned |
| **Extension Updates** | Auto-check for and apply extension updates. | Medium | 📋 Planned |
| **Extension Settings** | Per-extension settings panel in Settings. | Medium | 📋 Planned |
| **Extension Ratings** | Community ratings and reviews for extensions. | Low | 📋 Planned |

### v0.5.3 — Custom Agent Tools

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Tool Definition UI** | Visual editor for defining custom agent tools. | Medium | 📋 Planned |
| **Tool Schemas** | JSON Schema validation for tool inputs/outputs. | Medium | 📋 Planned |
| **Tool Testing** | Test custom tools directly from the editor. | Medium | 📋 Planned |
| **Tool Sharing** | Export/import tool definitions as JSON. | Low | 📋 Planned |

### v0.5.4 — Webview API

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Webview Panel** | Embed custom HTML/JS panels in the editor. | Medium | 📋 Planned |
| **Webview Messaging** | Bi-directional messaging between webview and extension. | Medium | 📋 Planned |
| **Webview Resources** | Serve static resources from extensions. | Low | 📋 Planned |

### v0.5.5 — Extension Development Tools

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Extension Scaffolder** | `create-extension` CLI to bootstrap new extensions. | Medium | 📋 Planned |
| **Extension Debugger** | Debug extensions with breakpoints and console. | Medium | 📋 Planned |
| **Extension Tests** | Test framework for extensions (unit + integration). | Low | 📋 Planned |
| **Extension Documentation** | Auto-generate docs from extension manifests. | Low | 📋 Planned |

### v0.5.6 — Language Support Extensions

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Language Pack API** | API for adding new language support via extensions. | Medium | 📋 Planned |
| **Syntax Highlighting API** | Custom syntax highlighting grammars. | Medium | 📋 Planned |
| **Snippet API** | Define and share code snippets via extensions. | Low | 📋 Planned |

### v0.5.7 — UI Extension Points

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Sidebar Extensions** | Add custom panels to the sidebar. | Medium | 📋 Planned |
| **Status Bar Items** | Add custom items to the status bar. | Medium | 📋 Planned |
| **Context Menus** | Add items to right-click context menus. | Low | 📋 Planned |
| **Notifications API** | Show notifications from extensions. | Low | 📋 Planned |

### v0.5.8 — Extension Security

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Extension Permissions** | Declare required permissions in manifest. | High | 📋 Planned |
| **Extension Signing** | Cryptographic signing of extensions. | Medium | 📋 Planned |
| **Extension Sandboxing** | Strict sandboxing for untrusted extensions. | High | 📋 Planned |

### v0.5.9 — Extension Ecosystem

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Extension Registry** | Hosted registry for distributing extensions. | Medium | 📋 Planned |
| **Extension Analytics** | Usage analytics for extension authors. | Low | 📋 Planned |
| **Extension Dependencies** | Declare and manage extension dependencies. | Low | 📋 Planned |

---

### v1.0.0 — Stability & Polish 🏁 (Q4 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Comprehensive Test Suite** | Unit, integration, and E2E tests covering all core features | High | 📋 Planned |
| **Performance Benchmarks** | Automated performance regression testing | Medium | 📋 Planned |
| **Accessibility Audit** | WCAG 2.2 AA compliance, screen reader support | High | 📋 Planned |
| **Internationalization (i18n)** | Multi-language UI support | Medium | 📋 Planned |
| **Documentation Site** | Dedicated docs site with search, tutorials, API reference | Medium | 📋 Planned |

### v1.0.1 — Test Coverage

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Unit Test Suite** | 80%+ coverage for all packages. | High | 📋 Planned |
| **Integration Tests** | End-to-end tests for agent, MCP, and skills. | High | 📋 Planned |
| **E2E Tests** | Playwright tests for critical user journeys. | Medium | 📋 Planned |
| **CI Test Gates** | Required test pass before merge. | High | 📋 Planned |

### v1.0.2 — Performance Benchmarks

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Startup Time** | Benchmark and optimize cold start time. | High | 📋 Planned |
| **File Open Latency** | Benchmark file open time for large files. | Medium | 📋 Planned |
| **Agent Response Time** | Benchmark agent round-trip time. | Medium | 📋 Planned |
| **Memory Footprint** | Track and optimize memory usage. | Medium | 📋 Planned |
| **Bundle Size** | Track and optimize bundle sizes per release. | Medium | 📋 Planned |

### v1.0.3 — Accessibility

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Screen Reader Support** | ARIA labels for all interactive elements. | High | 📋 Planned |
| **Keyboard Navigation** | Full keyboard access for all panels and menus. | High | 📋 Planned |
| **High Contrast Theme** | WCAG AAA contrast ratios. | Medium | 📋 Planned |
| **Reduced Motion** | Respect `prefers-reduced-motion` for animations. | Medium | 📋 Planned |
| **Focus Indicators** | Visible focus indicators on all focusable elements. | High | 📋 Planned |

### v1.0.4 — Internationalization

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **i18n Framework** | Set up i18n with message catalogs. | High | 📋 Planned |
| **Translation Files** | English, Spanish, French, German, Japanese, Chinese. | Medium | 📋 Planned |
| **RTL Support** | Right-to-left layout for Arabic, Hebrew. | Low | 📋 Planned |
| **Date/Number Formatting** | Locale-aware date and number formatting. | Medium | 📋 Planned |

### v1.0.5 — Documentation Site

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Docs Framework** | Set up Docusaurus or similar for docs site. | High | 📋 Planned |
| **API Reference** | Auto-generated from RPC method definitions. | Medium | 📋 Planned |
| **Tutorials** | Step-by-step guides for common workflows. | Medium | 📋 Planned |
| **Changelog Integration** | Auto-publish changelog to docs site. | Low | 📋 Planned |

### v1.0.6 — Release Engineering

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Auto-release Pipeline** | Automated release process from tag to publish. | High | 📋 Planned |
| **Nightly Builds** | Automated nightly builds for testing. | Medium | 📋 Planned |
| **Canary Releases** | Roll out releases to a percentage of users. | Low | 📋 Planned |
| **Rollback Mechanism** | Auto-rollback on critical failures. | Medium | 📋 Planned |

### v1.0.7 — Monitoring & Observability

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Error Tracking** | Integrated error tracking and reporting. | High | 📋 Planned |
| **Usage Telemetry** | Anonymous usage stats (opt-in) for improvement. | Medium | 📋 Planned |
| **Performance Monitoring** | Real-time performance metrics in production. | Medium | 📋 Planned |
| **Crash Reporting** | Automatic crash report collection. | Medium | 📋 Planned |

### v1.0.8 — Security Audit

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Security Review** | Third-party security audit of the codebase. | High | 📋 Planned |
| **Dependency Audit** | Automated dependency vulnerability scanning. | High | 📋 Planned |
| **Secret Scanning** | Prevent secrets from being committed. | Medium | 📋 Planned |
| **CSP Hardening** | Strict Content Security Policy. | Medium | 📋 Planned |

### v1.0.9 — Final Polish

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **UI Consistency Pass** | Ensure consistent styling across all panels. | Medium | 📋 Planned |
| **Error Message Quality** | User-friendly error messages everywhere. | Medium | 📋 Planned |
| **Loading States** | Skeleton loaders and spinners for all async operations. | Low | 📋 Planned |
| **Empty States** | Friendly empty states for all panels. | Low | 📋 Planned |
| **Changelog Cleanup** | Comprehensive changelog for v1.0.0. | High | 📋 Planned |

---

## 🗣️ Community Requests

Track and vote on feature requests via [GitHub Issues](https://github.com/wildfirebill-ai/localai-code-editor/issues?q=is%3Aissue+is%3Aopen+label%3A%22feature+request%22).

Current top requests:
1. **Offline Model Download** — Built-in model downloader for Ollama/LM Studio
2. **Voice Input** — Speech-to-text for agent prompts
3. **Plugin/Extension API** — Third-party extensibility
4. **Collaborative Editing** — Multi-user real-time editing
5. **Better Test Coverage** — Comprehensive test suite

---

## 🤝 How to Contribute to the Roadmap

1. **Vote** — React with 👍 on existing issues
2. **Propose** — Open a new issue with the `roadmap` label
3. **Build** — Pick up a 📋 Planned item and start a PR
4. **Discuss** — Join discussions on the issue tracker

---

## 📊 Priority Definitions

| Label | Meaning |
|-------|---------|
| **High** | Blocking for next release, high user impact |
| **Medium** | Important but not blocking, good first PR candidates |
| **Low** | Nice to have, community-driven |
| **📋 Planned** | Approved for a specific milestone |
| **🔄 In Progress** | Actively being worked on |
| **✅ Done** | Released |

---

*Last updated: 2026-08-25*
