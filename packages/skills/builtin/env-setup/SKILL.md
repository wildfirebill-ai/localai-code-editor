---
name: env-setup
description: Bootstrap a working dev environment from the repo and prove it works end-to-end
category: devops
---
Go from fresh clone to running app:

1. **Read the map**: README, CONTRIBUTING, package.json scripts/engines, docker-compose, .env.example. Collect every stated prerequisite before installing anything.
2. **Install toolchain**: exact major versions from engines fields (nvm/pyenv/asdf as available). Verify with `--version` — "installed" and "correct version" differ.
3. **Dependencies**: install per project (pnpm install). Read postinstall warnings; native module failures usually mean missing system libs or wrong Node ABI.
4. **Configuration**: copy .env.example → .env; fill required values, generating secrets where needed (document what you generated). Note which vars are optional vs blocking.
5. **Infrastructure**: start external services (DB via compose, etc.) BEFORE migrations/seeds; run them in order; verify connections with a real query/ping, not by absence of errors in logs.
6. **Prove it works**: run the app + its test suite. Hit the main URL/endpoint and confirm real output. "It compiled" is not "it works".
7. **Feed back**: every stumble is a docs bug — fix README/.env.example comments/scripts in the same pass so the next person skips it.

Report: working commands in order, gotchas found, doc fixes applied.
