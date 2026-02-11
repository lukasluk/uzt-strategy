# Deployment Safety Runbook

This project now includes safer deployment and migration scripts to protect live data.

## 1) Safe schema migration (when `schema_v1.sql` changed)

```bash
cd /srv/uzt-strategy-src
sudo bash deploy/migrate_schema_v1.sh
```

What it does:
- Creates a **pre-migration PostgreSQL backup** in `/srv/uzt-backups/database`.
- Applies `backend/src/schema_v1.sql` in a **single transaction** (`ON_ERROR_STOP=1`, `-1`).
- Uses a lock file to prevent concurrent migrations.

Optional variables:
- `DB_NAME` (default `uzt_strategy`)
- `SCHEMA_FILE` (default `/srv/uzt-strategy-src/backend/src/schema_v1.sql`)
- `RETENTION_DAYS` (default `30`)

## 2) Safe deploy

```bash
cd /srv/uzt-strategy-src
sudo bash deploy/deploy.sh
```

What it does:
- Prevents concurrent deploys (`flock` lock).
- Validates required env vars (`DATABASE_URL`, `AUTH_SECRET`, `SUPERADMIN_CODE`).
- Creates a **database backup** before deployment (unless `SKIP_DB_BACKUP=1`).
- Saves previous frontend/backend + nginx/service snapshots for rollback.
- Deploys code and restarts services.
- Runs post-deploy health check (`/api/v1/health`).
- Rolls back code/config snapshot automatically if deploy fails.

Optional variables:
- `SKIP_DB_BACKUP=1` to skip DB backup for non-production deploys.
- `HEALTH_URL` to override health endpoint.
- `RETENTION_DAYS` to control backup/snapshot retention (default `14`).

## 3) Manual rollback notes

If application-level issues appear after a successful deploy:
- Restore DB from the latest backup in `/srv/uzt-backups/database`.
- Restore code snapshot from `/srv/uzt-backups/releases/<timestamp>/`.

DB restore example:

```bash
sudo systemctl stop uzt-strategy-api
sudo -u postgres pg_restore --clean --if-exists --no-owner --dbname=uzt_strategy /srv/uzt-backups/database/<backup>.dump
sudo systemctl start uzt-strategy-api
```

Only run a DB restore after confirming the target backup and impact.
