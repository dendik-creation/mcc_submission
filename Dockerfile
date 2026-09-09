## Production image. Custom server (server.ts) provides the WebSocket
## gateway, so this cannot use Next's "standalone" output (docs/04) — the
## runtime stage ships full production node_modules instead.
##
## Bun builds (fast installs, `next build` works fine under Bun's shell-run
## script path) but the app is SERVED by Node — running server.ts directly
## under Bun's own runtime hits a real Bun/Next incompatibility
## (`AsyncLocalStorage accessed in runtime where it is not available`,
## confirmed during local verification), so the runtime stage uses a plain
## Node image instead of oven/bun.

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache curl
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/load-env.ts ./load-env.ts
COPY --from=build /app/lib ./lib
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=20s \
  CMD curl -f http://localhost:3000/api/health || exit 1

COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
