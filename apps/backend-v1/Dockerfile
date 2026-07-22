# Backend Dockerfile
FROM node:20-alpine AS base
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies for the whole workspace based on the pnpm lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .

# Build the backend
RUN pnpm --filter ./apps/backend run build

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy the built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Create logs directory
RUN mkdir -p logs && chown -R backend:nodejs logs

USER backend

EXPOSE 3001

ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
  process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]