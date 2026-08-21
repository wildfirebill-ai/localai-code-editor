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

### v0.2.0 — Agent Power-Ups 🔄 (Q4 2026)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Approve-before-apply mode** | Agent proposes edits as reviewable diffs; you accept/reject each one before it touches disk. Guardrail mode for untrusted repos and high-stakes work. | High | 📋 Planned |
| **Agent Skills Marketplace** | Built-in browser to discover, install, and share skills from a community registry | High | 📋 Planned |
| **Docker-in-Docker Sandbox** | Safe, isolated environment for agent to run/test code without host access | High | 📋 Planned |
| **Agent System Prompt Tuning UI** | Visual editor to customize the agent's system prompt, tool descriptions, and behavior | Medium | 📋 Planned |
| **Skill Auto-Application** | Auto-suggest and apply relevant skills based on file type, project type, or task | Medium | 📋 Planned |
| **Enhanced MCP Tool Discovery** | Better UI for browsing available tools from connected MCP servers | Medium | 📋 Planned |
| **Agent Task History/Replay** | View, replay, and branch from previous agent task trajectories | Medium | 📋 Planned |

---

### v0.3.0 — Editor Polish 🎨 (Q1 2027)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Multi-Tab Editing** | Multiple file tabs with split views | High | 📋 Planned |
| **File Diff View** | Inline and side-by-side diff for git changes and agent edits | High | 📋 Planned |
| **Advanced Git Operations** | Interactive rebase, cherry-pick, stash, submodule support | Medium | 📋 Planned |
| **Workspace Symbols** | Go-to-symbol across workspace (LSP-powered) | Medium | 📋 Planned |
| **Refactoring Actions** | Extract function, rename, move file (LSP code actions) | Medium | 📋 Planned |
| **Custom Keybindings** | User-configurable keyboard shortcuts | Low | 📋 Planned |
| **Theme Customization** | Custom color themes, font ligatures, editor settings UI | Low | 📋 Planned |

---

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

*Last updated: 2026-08-20*