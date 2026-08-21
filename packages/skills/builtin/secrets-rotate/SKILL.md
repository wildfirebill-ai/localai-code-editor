---
name: secrets-rotate
description: Rotate a leaked credential end-to-end — revoke old, deploy new, scrub history, verify dead
category: security
---
Respond to an exposed secret properly (order matters):

1. **Assume it's compromised the moment it leaked** — into git history, a log, a screenshot, or a chat. Speed beats elegance: rotation FIRST, cleanup SECOND.
2. **Revoke/rotate at the provider**: create the new key, then REVOKE the old one (not just stop-using — it must be dead at the source). For OAuth/user tokens: force reset. For DB passwords: change user password / rotate in managed service. Note anything that can't be instantly revoked (some legacy providers) and flag loudly.
3. **Deploy the replacement**: update the secret store/env/CI variable everywhere the old value is referenced — search the repo AND deployment configs for the old value's usage sites so nothing breaks when it dies.
4. **Scrub history**: remove from current files, add to .gitignore/.env handling. History rewrite (git filter-repo/BFG) ONLY after all old values are revoked — rewriting history without revocation just hides the leak. Coordinate force-push with the team; commit hashes change.
5. **Verify death**: attempt auth with the OLD credential — must fail 401. Check provider audit logs for foreign use of the old key during its exposure window.
6. **Prevent recurrence**: pre-commit secret scanning (gitleaks), CI history scan, and move any "convenient" hardcoded fallbacks into proper env/config.

Report: what leaked + exposure window, revocation proof, deployment sites updated, verification results, prevention added.
