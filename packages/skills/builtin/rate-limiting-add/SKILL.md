---
name: rate-limiting-add
description: Add rate limiting that actually protects — right algorithm, keyed correctly, with sane limits
category: backend
---
Protect endpoints from abuse:

1. **Pick the targets**: auth/login (strict: 5/min per IP+account), password reset, expensive operations (exports, AI calls), public API generally. Unlimited anything = someone's loop script.
2. **Key choice matters most**: per-IP alone breaks behind proxies and punishes NAT users. Use IP + route for anonymous; user-ID/account for authenticated. If behind a reverse proxy, trust X-Forwarded-For ONLY from known proxy hops (else it's spoofable).
3. **Algorithm**: token bucket or sliding window. Fixed-window has burst spikes at boundaries. In-memory maps only for single-instance dev — production multi-instance needs Redis/DB-backed counters.
4. **Limits**: derive from real capacity (what does one request cost downstream?), not round numbers. Set both burst and sustained rates. Return 429 with `Retry-After` header and a machine-readable error body.
5. **Fail-open vs fail-closed**: decide explicitly what happens when the counter store is unreachable — login endpoints usually fail-closed, analytics fail-open. Document the choice.
6. **Verify**: test script hammering the endpoint → 429s appear at the configured threshold, resets after window, other users unaffected.

Report: endpoints protected, key strategy, limits chosen and why, store used.
