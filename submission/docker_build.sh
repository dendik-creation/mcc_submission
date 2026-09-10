#!/usr/bin/env bash
# VPS deployment: build → postgres → migrate → app → seed
# Usage: cp .env.example .env  # edit values first
#        bash docker_build.sh
set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.vps.yml"

# --- pre-flight ---
if [[ ! -f .env ]]; then
  echo "[deploy] ERROR: .env file not found. Copy .env.example and fill in production values."
  exit 1
fi

if ! docker network inspect nginx-proxy-manager-app-1 >/dev/null 2>&1; then
  echo "[deploy] ERROR: network 'nginx-proxy-manager-app-1' not found."
  echo "         Make sure Nginx Proxy Manager is running and has created its network."
  exit 1
fi

# --- build ---
echo "[deploy] building images..."
$COMPOSE build --pull

# --- postgres ---
echo "[deploy] starting postgres..."
$COMPOSE up -d postgres

echo "[deploy] waiting for postgres..."
until $COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER:-submission_migrator}" -d "${POSTGRES_DB:-submission}" >/dev/null 2>&1; do
  sleep 2
done
echo "[deploy] postgres ready"

# --- app (runs migrations on startup) ---
echo "[deploy] starting app..."
$COMPOSE up -d app

echo "[deploy] waiting for app to be healthy..."
until $COMPOSE exec -T app curl -sf http://localhost:3000/api/health >/dev/null 2>&1; do
  sleep 3
done
echo "[deploy] app healthy"

# --- seed (idempotent: onConflictDoNothing) ---
echo "[deploy] running seeder..."
$COMPOSE run --rm seed

echo ""
echo "[deploy] done."
echo "  App:  http://<vps-ip>:59111  (or via Nginx Proxy Manager)"
echo "  Network: nginx-proxy-manager-app-1"
