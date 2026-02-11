#!/usr/bin/env bash
set -euo pipefail
umask 077

SRC_DIR="${SRC_DIR:-/srv/uzt-strategy-src}"
SCHEMA_FILE="${SCHEMA_FILE:-$SRC_DIR/backend/src/schema_v1.sql}"
DB_NAME="${DB_NAME:-uzt_strategy}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/uzt-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/database"
BACKUP_FILE="$BACKUP_DIR/uzt_strategy_pre_migration_${TIMESTAMP}.dump"
LOCK_FILE=/var/lock/uzt-strategy-migrate.lock

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $cmd"
    exit 1
  fi
}

require_command pg_dump
require_command psql
require_command flock

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "ERROR: schema file not found: $SCHEMA_FILE"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "ERROR: another migration is already running."
  exit 1
fi

echo "Creating pre-migration backup: $BACKUP_FILE"
sudo -u postgres pg_dump --format=custom --no-owner --no-privileges --file "$BACKUP_FILE" "$DB_NAME"
chmod 600 "$BACKUP_FILE"

echo "Applying schema file in a single transaction: $SCHEMA_FILE"
sudo -u postgres psql -v ON_ERROR_STOP=1 -1 -d "$DB_NAME" -f "$SCHEMA_FILE"

find "$BACKUP_DIR" -type f -name '*.dump' -mtime "+$RETENTION_DAYS" -delete || true

echo "Migration completed safely."
echo "Backup file: $BACKUP_FILE"
