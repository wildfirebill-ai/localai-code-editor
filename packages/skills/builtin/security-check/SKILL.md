---
name: security-check
description: Scan the codebase for common vulnerability patterns and report findings with severity
category: security
---
Audit the current project for common vulnerabilities, then report — do not auto-fix without asking:

1. **Secrets**: grep for hardcoded credentials — `api[_-]?key`, `secret`, `password`, `token`, `Bearer `, private key blocks (`BEGIN.*PRIVATE KEY`), connection strings with embedded passwords. Check `.env*` files are gitignored and not committed in history (`git log --all -- .env`).
2. **Injection surfaces**:
   - SQL built via string concatenation/template literals → parameterized queries.
   - `eval`, `new Function`, `child_process` with interpolated strings, `os.system`/`subprocess` with `shell=True` on user input.
   - HTML rendering of user data without escaping (XSS); `dangerouslySetInnerHTML`, `v-html`, `innerHTML =`.
3. **Path traversal**: any file API joining user-supplied paths — verify `..` is rejected and results stay inside the intended root.
4. **Network**: requests to user-controlled URLs (SSRF), missing TLS verification flags (`rejectUnauthorized: false`, `verify=False`), CORS `*` on credentialed endpoints.
5. **Dependencies**: run the ecosystem audit command; list only HIGH/CRITICAL findings.
6. **Report format**: table of finding | file:line | severity (Critical/High/Medium/Low) | why it matters | suggested fix. Explicitly state what you checked that was CLEAN. Do not fix anything until the user picks items.
