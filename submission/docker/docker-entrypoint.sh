#!/bin/sh
set -e

echo "[entrypoint] running database migrations"
node scripts/migrate.ts

echo "[entrypoint] starting server"
exec node server.ts
