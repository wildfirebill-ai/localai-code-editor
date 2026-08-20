# Contributing to LocalAI Code Editor

Thank you for your interest in contributing! This document outlines the guidelines for contributing to LocalAI Code Editor.

## 🎯 Ways to Contribute

- **Code** — Bug fixes, features, performance improvements
- **Documentation** — README, docs, code comments, tutorials
- **Testing** — Unit tests, integration tests, E2E tests, bug reports
- **Design** — UI/UX improvements, icons, themes
- **Community** — Answering questions, triaging issues, reviewing PRs

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10
- Git
- A local LLM server (Ollama recommended) for testing

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/localai-code-editor.git
cd localai-code-editor

# Install dependencies
pnpm install

# Build everything
pnpm build

# Run tests
pnpm test

# Start development
pnpm dev:server   # backend + web UI at http://127.0.0.1:4801
# or
pnpm dev:web      # Vite dev server with HMR at http://127.0.0.1:5173
# or
pnpm dev:desktop  # Electron app
```

---

## 📋 Development Workflow

### 1. Create an Issue First

Before starting work, check existing issues or create a new one:
- **Bug** — Use the bug report template
- **Feature** — Use the feature request template
- **Docs** — Label with `documentation`

### 2. Branch Naming

```
feat/<short-description>     # New feature
fix/<short-description>      # Bug fix
docs/<short-description>     # Documentation
refactor/<short-description> # Code refactoring
test/<short-description>     # Test improvements
chore/<short-description>    # Maintenance
```

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(agent): add read_skill tool for dynamic skill loading
fix(git): resolve branch name encoding in diff output
docs(readme): add Docker socket warning section
refactor(mcp): simplify tool call iteration logic
```

### 4. Quality Gates

Before pushing, run:

```bash
pnpm typecheck   # TypeScript compilation
pnpm lint        # ESLint + Prettier
pnpm test        # Unit + integration tests
pnpm build       # Production build
```

All must pass. CI will run these on PR.

### 5. Pull Request

- Fill out the PR template completely
- Link the related issue: `Fixes #123`
- Keep PRs focused — one feature/fix per PR
- Update docs if behavior changes
- Add tests for new functionality

---

## 🧪 Testing

### Test Commands

```bash
pnpm test              # All tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:watch        # Watch mode
```

### Writing Tests

- **Unit tests** — Test individual functions/classes in isolation
- **Integration tests** — Test package interactions (agent + MCP, LSP + editor)
- **E2E tests** — Full user flows (Playwright)

Place tests in `__tests__/` directories alongside source or in package `tests/` folders.

---

## 📝 Code Style

### TypeScript

- Strict mode enabled
- No `any` — use proper types or `unknown`
- Prefer `interface` over `type` for object shapes
- Use `const` by default, `let` when reassignment needed

### Formatting

- Prettier (single quotes, 2 spaces, trailing commas)
- ESLint with recommended rules
- Run `pnpm lint` before committing

### Architecture

- **Packages** — Independent, publishable units with clear boundaries
- **Apps** — Compose packages into runnable applications
- **Shared types** — In `packages/*/src/types.ts` or `packages/*/types.d.ts`

---

## 📚 Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md for notable changes
- Add JSDoc comments for exported APIs
- Update config examples in `localai.config.json.example`

---

## 🐛 Bug Reports

Use the bug report template. Include:

1. **Environment** — OS, Node version, pnpm version, LLM provider
2. **Steps to reproduce** — Minimal, clear steps
3. **Expected vs actual** — What should happen vs what happens
4. **Logs/screenshots** — Console output, error messages, screenshots
5. **Config** — Relevant parts of `localai.config.json` (redact secrets)

---

## ✨ Feature Requests

Use the feature request template. Include:

1. **Problem** — What problem does this solve?
2. **Solution** — Proposed approach
3. **Alternatives** — Other approaches considered
4. **Impact** — Who benefits, how often used

---

## 🔒 Security

- **Never commit secrets** — API keys, tokens, passwords
- Use `.env` files (gitignored) for local config
- Report security issues privately: **security@wildfirebill.ai**
- See [SECURITY.md](SECURITY.md) for full policy

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🙋 Getting Help

- **GitHub Discussions** — Questions, ideas, show-and-tell
- **GitHub Issues** — Bugs, feature requests
- **Discord** — [Join our community](https://discord.gg/localai-editor) (if available)

---

## 🏆 Recognition

Contributors are recognized in:
- Release notes
- CONTRIBUTORS.md (auto-generated)
- GitHub contributor graph

Thank you for making LocalAI Code Editor better! 🚀