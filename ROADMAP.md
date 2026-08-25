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

### v0.3.0 — Editor Polish 🎨 (Q1 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Multi-Tab Editing** | Multiple file tabs with split views | High | ✅ Done (v0.2.0) |
| **File Diff View** | Inline and side-by-side diff for git changes and agent edits | High | ✅ Done (v0.2.0) |
| **Search Across Files** | Workspace-wide text search with regex support | High | ✅ Done (v0.2.0) |
| **Advanced Git Operations** | Interactive rebase, cherry-pick, stash, submodule support | Medium | ⬜ Planned |
| **Workspace Symbols** | Go-to-symbol across workspace (LSP-powered) | Medium | ⬜ Planned |
| **Refactoring Actions** | Extract function, rename, move file (LSP code actions) | Medium | ⬜ Planned |
| **Custom Keybindings** | User-configurable keyboard shortcuts | Low | ✅ Done (v0.2.0) |
| **Theme Customization** | Custom color themes, font ligatures, editor settings UI | Low | ✅ Done (v0.2.0) |

### v0.4.0 — Collaboration & Scale 👥 (Q2 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Remote Collaboration** | Multi-user editing with presence, cursors, and shared agent sessions | High | 📋 Planned |
| **Session Sharing** | Share a live coding session with a colleague via link | Medium | 📋 Planned |
| **Team Skills Registry** | Private skill registry for organizations | Medium | 📋 Planned |
| **Agent Session Recording** | Record and share agent task sessions for review/debugging | Medium | 📋 Planned |
| **Project Templates** | Starter templates with pre-configured skills, LSPs, MCP | Low | 📋 Planned |

---

### v0.5.0 — Extensibility Platform 🔌 (Q3 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Plugin/Extension API** | Official API for third-party extensions (UI, tools, language support) | High | 📋 Planned |
| **Extension Marketplace** | Browse, install, and manage extensions from the editor | Medium | 📋 Planned |
| **Custom Agent Tools** | Define custom tools via config/skills without code changes | Medium | 📋 Planned |
| **Webview API** | Embed custom webviews in the editor (like VS Code) | Low | 📋 Planned |

---

### v1.0.0 — Stability & Polish 🏁 (Q4 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Comprehensive Test Suite** | Unit, integration, and E2E tests covering all core features | High | 📋 Planned |
| **Performance Benchmarks** | Automated performance regression testing | Medium | 📋 Planned |
| **Accessibility Audit** | WCAG 2.2 AA compliance, screen reader support | High | 📋 Planned |
| **Internationalization (i18n)** | Multi-language UI support | Medium | 📋 Planned |
| **Documentation Site** | Dedicated docs site with search, tutorials, API reference | Medium | 📋 Planned |

---

## 🗣️ Community Requests

Track and vote on feature requests via [GitHub Issues](https://github.com/wildfirebill-ai/localai-code-editor/issues?q=is%3Aissue+is%3Aopen+label%3A%22feature+request%22).

Current top requests:
1. **Settings UI** — Visual configuration editor (not JSON)
2. **Agent Cost Tracking** — Show token usage and estimated cost per task
3. **Model Comparison** — Run same prompt against multiple models side-by-side
4. **Offline Model Download** — Built-in model downloader for Ollama/LM Studio
5. **Voice Input** — Speech-to-text for agent prompts

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