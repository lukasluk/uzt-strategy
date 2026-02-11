#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR=/srv/uzt-strategy
FRONT_DIR=/var/www/uzt-strategy
SRC_DIR=/srv/uzt-strategy-src
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/v1/health}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/uzt-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
SKIP_DB_BACKUP="${SKIP_DB_BACKUP:-0}"
LOCK_FILE=/var/lock/uzt-strategy-deploy.lock
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_BACKUP_DIR="$BACKUP_ROOT/releases/$TIMESTAMP"
DB_BACKUP_DIR="$BACKUP_ROOT/database"
DB_BACKUP_FILE=""

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $cmd"
    exit 1
  fi
}

run_healthcheck() {
  local attempts="${1:-20}"
  local sleep_seconds="${2:-2}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS "$HEALTH_URL" >/dev/null; then
      return 0
    fi
    sleep "$sleep_seconds"
  done
  return 1
}

rollback_code() {
  if [ -d "$RELEASE_BACKUP_DIR/backend" ]; then
    rsync -az --delete "$RELEASE_BACKUP_DIR/backend/" "$APP_DIR/backend/"
  fi
  if [ -d "$RELEASE_BACKUP_DIR/frontend" ]; then
    rsync -az --delete "$RELEASE_BACKUP_DIR/frontend/" "$FRONT_DIR/"
  fi
  if [ -f "$RELEASE_BACKUP_DIR/nginx.conf.bak" ]; then
    sudo cp "$RELEASE_BACKUP_DIR/nginx.conf.bak" /etc/nginx/sites-available/uzt-strategy
  fi
  if [ -f "$RELEASE_BACKUP_DIR/uzt-strategy-api.service.bak" ]; then
    sudo cp "$RELEASE_BACKUP_DIR/uzt-strategy-api.service.bak" /etc/systemd/system/uzt-strategy-api.service
  fi
  sudo systemctl daemon-reload || true
  sudo nginx -t || true
  sudo systemctl reload nginx || true
  sudo systemctl restart uzt-strategy-api || true
}

on_error() {
  local line="$1"
  echo "ERROR: deployment failed at line $line."
  echo "Attempting rollback to previous code snapshot..."
  rollback_code
  echo "Rollback completed. Database restore is available from backup if needed."
  exit 1
}

require_command rsync
require_command curl
require_command flock
if [ "$SKIP_DB_BACKUP" != "1" ]; then
  require_command pg_dump
fi

mkdir -p "$APP_DIR" "$FRONT_DIR" /var/www/letsencrypt "$DB_BACKUP_DIR" "$BACKUP_ROOT/releases"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "ERROR: another deployment is already running."
  exit 1
fi

if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo "ERROR: missing $APP_DIR/backend/.env"
  echo "Create it from $APP_DIR/backend/.env.example before deploying."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$APP_DIR/backend/.env"
set +a

for var in DATABASE_URL AUTH_SECRET SUPERADMIN_CODE; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: required env var is missing in $APP_DIR/backend/.env: $var"
    exit 1
  fi
done

for var in AUTH_SECRET SUPERADMIN_CODE; do
  case "${!var}" in
    change-me|ilga_reiksme_be_tarpu|visa_reiksme_be_tarpu)
      echo "ERROR: insecure placeholder value detected for $var"
      exit 1
      ;;
  esac
done

if [ "$SKIP_DB_BACKUP" != "1" ]; then
  DB_BACKUP_FILE="$DB_BACKUP_DIR/uzt_strategy_${TIMESTAMP}.dump"
  echo "Creating database backup: $DB_BACKUP_FILE"
  pg_dump --format=custom --no-owner --no-privileges --file "$DB_BACKUP_FILE" "$DATABASE_URL"
  chmod 600 "$DB_BACKUP_FILE"
fi

mkdir -p "$RELEASE_BACKUP_DIR"
if [ -d "$APP_DIR/backend" ]; then
  rsync -az "$APP_DIR/backend/" "$RELEASE_BACKUP_DIR/backend/"
fi
if [ -d "$FRONT_DIR" ]; then
  rsync -az "$FRONT_DIR/" "$RELEASE_BACKUP_DIR/frontend/"
fi
if [ -f /etc/nginx/sites-available/uzt-strategy ]; then
  sudo cp /etc/nginx/sites-available/uzt-strategy "$RELEASE_BACKUP_DIR/nginx.conf.bak"
fi
if [ -f /etc/systemd/system/uzt-strategy-api.service ]; then
  sudo cp /etc/systemd/system/uzt-strategy-api.service "$RELEASE_BACKUP_DIR/uzt-strategy-api.service.bak"
fi

trap 'on_error $LINENO' ERR

echo "Deploying frontend..."
rsync -az --delete "$SRC_DIR/prototype/" "$FRONT_DIR/"
echo "Deploying backend (preserving runtime .env)..."
rsync -az --delete --exclude ".env" "$SRC_DIR/backend/" "$APP_DIR/backend/"

cd "$APP_DIR/backend"
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo "ERROR: missing $APP_DIR/backend/.env"
  echo "Create it from $APP_DIR/backend/.env.example before restarting the service."
  exit 1
fi
chmod 600 "$APP_DIR/backend/.env"

sudo cp "$SRC_DIR/deploy/uzt-strategy-api.service" /etc/systemd/system/uzt-strategy-api.service
sudo cp "$SRC_DIR/deploy/nginx.conf" /etc/nginx/sites-available/uzt-strategy
sudo ln -sfn /etc/nginx/sites-available/uzt-strategy /etc/nginx/sites-enabled/uzt-strategy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

sudo systemctl daemon-reload
sudo systemctl enable uzt-strategy-api
sudo systemctl reload nginx
sudo systemctl restart uzt-strategy-api

echo "Running post-deploy health check: $HEALTH_URL"
run_healthcheck 20 2

trap - ERR

find "$DB_BACKUP_DIR" -type f -name '*.dump' -mtime "+$RETENTION_DAYS" -delete || true
find "$BACKUP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -exec rm -rf {} + || true

echo "Deployment completed safely."
if [ -n "$DB_BACKUP_FILE" ]; then
  echo "Database backup: $DB_BACKUP_FILE"
fi
echo "Release backup: $RELEASE_BACKUP_DIR"
