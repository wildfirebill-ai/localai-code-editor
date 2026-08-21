---
name: auth-flow-audit
description: Review an authentication/authorization flow for the classic flaws before an attacker finds them
category: security
---
Audit an auth implementation:

1. **Credential storage**: passwords hashed with bcrypt/scrypt/argon2 (cost ≥ current recommendation)? No MD5/SHA-1/plain. No salts hand-rolled — library-managed.
2. **Session/token lifecycle**: 
   - Tokens have expiry; refresh tokens rotate on use and are revoked on logout/password change.
   - JWTs: algorithm pinned (never `alg` from token), signature verified server-side, sensitive claims not trusted from client.
   - Session fixation: new session ID issued at login.
3. **Login hardening**: constant-time comparison for secrets, generic error messages ("invalid credentials" — never "user not found"), rate limiting / lockout on repeated failures, timing-safe reset tokens (single-use, short-lived).
4. **Authorization (the big one)**: every endpoint that touches a resource checks OWNERSHIP, not just authentication. IDOR test: can user A fetch/modify user B's resource by changing the ID? Check every route with an :id parameter.
5. **Reset & recovery**: reset links expire, are single-use, and invalidate existing sessions. Recovery questions avoided entirely.
6. **Transport**: no credentials in URLs or logs; cookies Secure + HttpOnly + SameSite.

Report findings as: flaw | location file:line | attack scenario | severity | concrete fix. Verify what's DONE RIGHT too, so the report is trustworthy.
