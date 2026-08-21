---
name: docker-compose-debug
description: Debug multi-container compose setups — networking, health, env, and ordering failures
category: devops
---
Fix a broken compose stack methodically:

1. **Per-container status**: `docker compose ps` — exited vs restarting vs running. `docker compose logs <svc> --tail=100` for each failing one; the FIRST error in each log matters, not the crash-loop repeats.
2. **Service-to-service networking**: containers reach each other by SERVICE NAME on the default network, never localhost. A frontend calling `localhost:5432` inside a container is calling itself. Test from inside: `docker compose exec <svc> wget -qO- http://<other-svc>:<port>/health`.
3. **Startup ordering**: app crashing because DB isn't ready → add healthcheck + `depends_on: condition: service_healthy` to the DEPENDENT service (compose v2 syntax). Retry loops in app code are a band-aid; real readiness gates beat sleeps.
4. **Env & secrets**: `docker compose config` shows the FINAL interpolated values — verify variables actually arrived (typo'd env_file keys silently become empty). Host .env ≠ container env.
5. **Volumes/permissions**: permission denied in a mount → check host dir ownership vs container user (especially named vs bind mounts on Linux). Data "disappearing" = anonymous volume shadowing your mount.
6. **Ports**: "port already allocated" → another stack/host process owns it; change the HOST side of the mapping (`4801:4801` → `4802:4801`), not the container port.

Report per service: status, root cause, fix. End with all services healthy + a successful cross-service request.
