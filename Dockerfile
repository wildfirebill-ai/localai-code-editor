# ---- Builder stage: install deps + compile all packages ----
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10

# Leverage layer caching: install deps first, then copy source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --frozen-lockfile
RUN pnpm build
# Dependency-free single-file server bundle — the runtime stage ships ONLY this,
# so the container carries no node_modules (and none of their CVEs).
RUN pnpm --filter @localai/server build:bundle

# ---- Runtime stage: only what the server needs ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    LOCALAI_HOST=0.0.0.0 \
    LOCALAI_PORT=4801 \
    LOCALAI_WEB_DIST=/app/web \
    LOCALAI_SKILLS_DIR=/app/skills
WORKDIR /app

# Patch OS packages at build time — the base image ships with whatever apk
# packages were baked when it was built, so this clears most container CVEs.
RUN apk update && apk upgrade --no-cache && \
    # Alpine lacks git by default; the server shells out to git for the panel
    apk add --no-cache git docker-cli docker-cli-compose docker-cli-buildx && \
    rm -rf /var/cache/apk/* && \
    # docker CLI needs a working config dir even without a daemon locally
    mkdir -p /root/.docker

# The bundled server (zero node_modules), built web UI, and builtin skills.
COPY --from=build /app/packages/server/dist-server ./server-dist
COPY --from=build /app/apps/web/dist ./web
COPY --from=build /app/packages/skills/builtin ./skills

# Where users mount the repo they want to edit
VOLUME /workspace
EXPOSE 4801

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4801/ >/dev/null 2>&1 || exit 1

CMD ["node", "server-dist/index.cjs", "--host", "0.0.0.0", "--workspace", "/workspace"]