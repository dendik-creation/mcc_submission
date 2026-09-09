import { existsSync } from "node:fs"

// Side-effect only: loads .env for local `node server.ts` runs. In Docker,
// compose injects env vars directly (no .env file — see .dockerignore), so
// this is a no-op there. Must be the FIRST import in server.ts so it runs
// before any module (e.g. lib/db/client.ts) reads process.env at import time.
if (existsSync(".env")) {
  process.loadEnvFile(".env")
}
