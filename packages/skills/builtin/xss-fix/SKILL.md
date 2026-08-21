---
name: xss-fix
description: Find and fix XSS vectors — sink inventory, trusted-types discipline, framework-safe patterns
category: security
---
Eliminate cross-site scripting from frontend code:

1. **Inventory the sinks**: grep for `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `document.write`, `insertAdjacentHTML`, `$(` with HTML strings, `eval`, `new Function`, inline `onclick="…"` attributes, and href/src built from user data (`javascript:` URIs).
2. **Trace each sink's data source**: does any string flowing in originate from user input, URL params, stored DB content, or third-party responses? Content from YOUR OWN database is still attacker-controlled (stored XSS) if users ever wrote it.
3. **Fix by context**:
   - Default: render as TEXT (framework auto-escaping handles it). Delete the raw-HTML sink.
   - Legit rich text → sanitize server-side AND client-side with DOMPurify (configured allowlist), never a hand-rolled regex strip.
   - URLs from data → allowlist schemes (http/https/mailto); block `javascript:`/`data:`; encode attribute values.
   - JSON embedded in script tags → escape `<` / use safe serialization.
4. **Framework escapes don't cover everything**: React escapes children but NOT dangerouslySetInnerHTML, href values, or attribute objects you spread. Audit those three explicitly.
5. **Verify with attacks**, not vibes: test payloads `<img src=x onerror=alert(1)>`, `"><script>…`, and `javascript:alert(1)` in a link param through every fixed path — confirm they render inert.

Report: each sink → data source → verdict (safe/unsafe) → fix applied. Sinks left intentionally get sanitization proof.
