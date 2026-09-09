# Competition Operations Dashboard

Next.js 16 (App Router) + shadcn/ui + Drizzle ORM/PostgreSQL app for running
the Vibe Code Competition MCC 2026 — participant submissions, server-timed
countdown with a realtime WebSocket gateway, judge scoring, and a lockable
results snapshot. Full spec lives in `../docs/`; `../docs/DECISIONS.md`
records defaults that still need committee review before a real event, and
`../docs/RUNBOOK.md` is the day-of operator guide.

## Local development

Requires Docker (for Postgres) and Bun (for package management/dev tooling).
The app itself runs under **Node**, not Bun — see the note in `server.ts`.

```bash
bun install

# One-off local Postgres for development (not the production compose stack):
docker run -d --name submission-postgres-dev \
  -e POSTGRES_DB=submission -e POSTGRES_USER=submission_migrator \
  -e POSTGRES_PASSWORD=devpassword -p 127.0.0.1:5432:5432 postgres:16-alpine

cp .env.example .env   # then edit — for the container above, the defaults work as-is

bun run db:generate    # only after changing lib/db/schema.ts
bun run db:migrate
bun run db:seed        # 2 judge accounts + a placeholder competition row

bun run dev            # node server.ts — custom server + WebSocket gateway at /ws
```

Other scripts: `bun run typecheck`, `bun run lint`, `bun run test` (Vitest —
scoring math, tie-breaker ordering, timer state machine, URL validation),
`bun run build`.

## Production (Docker)

```bash
docker network create submission-app   # once, shared with Nginx Proxy Manager
docker compose build
docker compose up -d
```

Postgres never publishes a host port and only joins the private
`submission-private` network; the app joins both `submission-private` and
the external `submission-app` network (where Nginx Proxy Manager lives).
Migrations run automatically (advisory-lock guarded) before the server
starts. See `../docs/RUNBOOK.md` for the NPM reverse-proxy config (including
the WebSocket upgrade block) and day-of operator procedures.

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

## Using components

```tsx
import { Button } from "@/components/ui/button"
```
