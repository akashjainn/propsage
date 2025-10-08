# API service Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable

# Copy manifests first for better caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/

# Install all (need dev deps to compile TS) for filtered packages
RUN pnpm install --frozen-lockfile --filter @propsage/core... --filter @propsage/api...

# Copy full source now
COPY packages ./packages
COPY apps/api ./apps/api
COPY data ./data

# Build (turborepo not strictly necessary here)
RUN pnpm --filter @propsage/core build && pnpm --filter @propsage/api build

# Prune dev dependencies to reduce image size
RUN pnpm prune --prod

ENV NODE_ENV=production PORT=4000
EXPOSE 4000
# Healthcheck for orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:4000/readyz || exit 1

CMD ["node","apps/api/dist/index.js"]
