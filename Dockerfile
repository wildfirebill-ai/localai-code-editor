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

# ---- Runtime stage: only what the server needs ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    LOCALAI_HOST=0.0.0.0 \
    LOCALAI_PORT=4801
WORKDIR /app

# Patch OS packages at build time — the base image ships with whatever apk
# packages were baked when it was built, so this clears most container CVEs.
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

RUN npm install -g pnpm@10 && \
    # Alpine lacks git by default; the server shells out to git for the panel
    apk add --no-cache git docker-cli docker-cli-compose docker-cli-buildx && \
    # docker CLI needs a working config dir even without a daemon locally
    mkdir -p /root/.docker

# Copy node_modules (incl. workspace symlinks) and built output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web/dist ./apps/web/dist

# Where users mount the repo they want to edit
VOLUME /workspace
EXPOSE 4801

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4801/ >/dev/null 2>&1 || exit 1

CMD ["node", "packages/server/dist/index.js", "--host", "0.0.0.0", "--workspace", "/workspace"]