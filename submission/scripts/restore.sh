#!/bin/sh
# Restores a .sql dump (from backup.sh) into the running compose Postgres.
# DESTRUCTIVE: drops and recreates the public schema first.
# Usage: ./scripts/restore.sh path/to/backup.sql
set -e

FILE="$1"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 path/to/backup.sql" >&2
  exit 1
fi

echo "[restore] dropping and recreating public + drizzle schemas on $POSTGRES_DB"
# Drizzle keeps its migration bookkeeping table in a separate "drizzle"
# schema — drop it too, or restoring a dump that recreates it collides with
# what's already there (found by actually running this drill, not assumed).
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[restore] loading $FILE"
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$FILE"

echo "[restore] done"
