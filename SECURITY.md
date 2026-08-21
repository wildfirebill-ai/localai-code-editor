# Security Policy

## 🔒 Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes    |
| < 0.1.0 | ❌ No     |

We provide security updates for the latest minor release of each major version.

---

## 🛡️ Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, report them privately via:

- **Email:** security@wildfirebill.ai
- **GitHub Security Advisories:** [Private vulnerability reporting](https://github.com/wildfirebill-ai/localai-code-editor/security/advisories/new)

Include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to:
- Acknowledge within 48 hours
- Provide initial assessment within 7 days
- Release a fix within 30 days for critical issues

---

## 🔐 Security Principles

> **Transparency first:** known weaknesses and accepted risks are documented publicly in [VULNERABILITIES.md](VULNERABILITIES.md) — including prompt-injection exposure, the unauthenticated server, and Docker socket implications. Read it before deploying beyond localhost.

### Local-First by Design

LocalAI Code Editor is built on a **local-first architecture**:

- **No external network calls** unless explicitly configured by the user
- **No telemetry, analytics, or tracking** — ever
- **No automatic updates** that could execute untrusted code
- **No cloud dependencies** for core functionality

### Agent Safety

The AI agent operates with **explicit user consent**:

| Capability | Default | Control |
|------------|---------|---------|
| File read/write | ✅ Enabled | Workspace-scoped |
| Shell commands | ❌ Disabled | `allowShell: true` in config |
| MCP tool calls | ✅ Enabled | Per-server config |
| Network requests | ❌ Disabled | Only via configured MCP/HTTP servers |
| Docker socket | ❌ Disabled | Opt-in with explicit warning |

### Protected Paths

The agent **cannot** access paths matching `protectedPaths` in config (default: `[".git"]`). This prevents:
- Credential leakage (`.env`, `.npmrc`, SSH keys)
- Repository corruption
- Unintended modifications to sensitive files

### Configuration Security

- **No secrets in config** — Use environment variables or secure secret stores
- **Config validation** — All config parsed with strict schema validation
- **No eval/exec** — Config is data-only, never executed as code

---

## 🐳 Docker Security

### Socket Mount Warning

Mounting `/var/run/docker.sock` grants **root-equivalent control** over the Docker host to the container. Because the AI agent can run **arbitrary shell commands**, anything reaching the editor's web UI could take over your host.

**Safe alternatives:**
| Option | Description | Risk |
|--------|-------------|------|
| **B — Build on host** | Edit in editor, build on host against mounted workspace | ✅ None |
| **C — Docker-in-Docker** | Nested Docker daemon inside container | ✅ Isolated |
| **A — Socket mount** | Direct socket access | ⚠️ Root host access |

**Never expose the editor's UI to the internet** while the Docker socket is mounted.

### Container Hardening

The Docker image:
- Runs as non-root user (`node:22-alpine`)
- Uses multi-stage builds (minimal runtime image)
- No unnecessary packages
- Health checks for orchestration
- Read-only root filesystem (where possible)

---

## 🔑 Secret Management

### Never Commit Secrets

The following are **never** committed:
- API keys (OpenAI, Anthropic, etc.)
- Database passwords
- SSH keys, certificates
- Docker registry credentials
- CI/CD tokens

### Recommended Practices

1. **Use `.env` files** (gitignored) for local development
2. **Use secret managers** in production (1Password, Vault, AWS Secrets Manager)
3. **Rotate keys** regularly
4. **Use least-privilege** credentials

---

## 📦 Supply Chain Security

### Dependencies

- All dependencies pinned in `pnpm-lock.yaml`
- `pnpm install --frozen-lockfile` in CI
- `pnpm audit` runs in CI pipeline
- Dependabot configured for automated updates

### Actions

- All GitHub Actions pinned to SHA or major version
- Actions reviewed before upgrades
- Minimal permissions (`contents: read`, `packages: write`)

### Build Integrity

- Multi-stage Docker builds with `--platform`
- SBOM generation (planned)
- Image signing with cosign (planned)

---

## 🚨 Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | RCE, data exfiltration, auth bypass | < 24 hours |
| **High** | Privilege escalation, significant data exposure | < 72 hours |
| **Medium** | Info disclosure, DoS, logic bugs | < 7 days |
| **Low** | Minor info leaks, cosmetic issues | < 30 days |

### Process

1. **Triage** — Assess severity, impact, exploitability
2. **Contain** — Disable affected feature, deploy hotfix if needed
3. **Fix** — Root cause analysis, patch development, testing
4. **Release** — Security patch release, advisory publication
5. **Postmortem** — Public retrospective (for Critical/High)

---

## ✅ Security Checklist for Contributors

- [ ] No hardcoded secrets in code
- [ ] Input validation on all user inputs
- [ ] No `eval()`, `Function()`, or dynamic code execution
- [ ] Path traversal protection on file operations
- [ ] Command injection prevention on shell commands
- [ ] Proper error handling (no stack traces to user)
- [ ] Dependencies updated, no known vulnerabilities
- [ ] Tests cover security-relevant code paths

---

## 📞 Contact

- **Security Email:** security@wildfirebill.ai
- **PGP Key:** [Available on request](security@wildfirebill.ai)
- **Security Advisories:** [GitHub Security](https://github.com/wildfirebill-ai/localai-code-editor/security/advisories)

---

## 📜 Compliance

LocalAI Code Editor is designed to support compliance with:
- **GDPR** — No personal data collection
- **SOC 2** — No external data transmission by default
- **ISO 27001** — Security controls aligned with best practices

*This is not legal advice. Consult your compliance officer for your specific requirements.*