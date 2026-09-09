#!/bin/sh
# Dumps the running compose Postgres to a timestamped .sql file on the host.
# Run from the submission/ directory: ./scripts/backup.sh [output-dir]
set -e

OUT_DIR="${1:-./backups}"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_FILE="$OUT_DIR/submission-$STAMP.sql"

mkdir -p "$OUT_DIR"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$OUT_FILE"

echo "[backup] wrote $OUT_FILE ($(wc -l < "$OUT_FILE") lines)"
