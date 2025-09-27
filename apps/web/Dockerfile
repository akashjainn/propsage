# Web (Next.js) Dockerfile for production build
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# Copy manifests
COPY package.json pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/

# Install deps (includes dev for building)
RUN pnpm install --filter @propsage/web... --filter @propsage/core...

# Copy source
COPY packages ./packages
COPY apps/web ./apps/web

# Build (Next.js standalone output recommended later)
WORKDIR /app/apps/web
RUN pnpm run build || npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm","start"]
