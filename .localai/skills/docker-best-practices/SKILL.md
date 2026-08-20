---
name: docker-best-practices
description: Apply Docker best practices when writing Dockerfiles and docker-compose files
category: docker
---

Apply these Docker best practices when creating or modifying container configurations:

## Dockerfile

1. **Use multi-stage builds** — Separate build and runtime stages
2. **Pin base images** — Use specific tags (e.g., `node:22-alpine@sha256:...`)
3. **Minimize layers** — Combine RUN commands, clean caches
4. **Non-root user** — `USER node` or dedicated user
5. **Read-only root fs** — Where possible, use `--read-only`
6. **Health checks** — `HEALTHCHECK` for orchestration
7. **No secrets** — Never embed credentials, use build args or runtime env

## docker-compose

1. **Version pinning** — Pin image tags
2. **Resource limits** — `deploy.resources.limits`
3. **Health checks** — For all services
3. **Networks** — Custom bridge networks, not default
4. **Secrets** — Use `secrets:` not environment variables
5. **Restart policies** — `unless-stopped` or `on-failure`

## Security

- Run as non-root
- Drop capabilities (`cap_drop: [ALL]`)
- Read-only filesystem where possible
- No privileged mode
- Use `--security-opt=no-new-privileges:true`

## Example Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime stage
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
USER node
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
EXPOSE 4801
HEALTHCHECK CMD wget -qO- http://localhost:4801/ || exit 1
CMD ["node", "dist/index.js"]
```

**Usage:** The agent will apply these practices when you ask it to "create a Dockerfile" or "optimize the Docker config."