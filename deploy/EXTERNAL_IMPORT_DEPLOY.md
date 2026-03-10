# External Import Deployment Notes

This release adds:

- external `Use in my strategy` import actions in the UI
- new member API endpoints for import proposals
- `source_meta_json` on `strategy_card_proposals`
- automatic strategic-link creation when an imported parent guideline is approved

## Server steps

Run on the server:

```bash
cd /srv/uzt-strategy-src
git pull origin master
sudo bash deploy/migrate_schema_v1.sh
sudo bash deploy/deploy.sh
```

## What changed in the database

`backend/src/schema_v1.sql` now adds:

```sql
alter table if exists strategy_card_proposals
  add column if not exists source_meta_json jsonb not null default '{}'::jsonb;
```

The deploy is not complete until that column exists in production.

## Post-deploy verification

Check health:

```bash
curl -fsS http://127.0.0.1:3000/api/v1/health
```

Check service status:

```bash
sudo systemctl status uzt-strategy-api --no-pager
sudo journalctl -u uzt-strategy-api -n 100 --no-pager
```

## Functional smoke test

1. Sign in as a user whose home institution has an open cycle.
2. Browse a different institution strategy.
3. Open an external guideline detail page and confirm `Use in my strategy` is visible.
4. Open an external initiative detail page and confirm `Use in my strategy` is visible.
5. Open the map popup for an external guideline/initiative and confirm the same action is visible there.
6. Switch back to your own institution strategy and confirm the action is not visible.
7. Import one external guideline and confirm a pending proposal is created in the home institution cycle.
8. Approve an imported parent guideline and confirm a strategic link appears after approval.

## Rollback

If the release fails after migration or deploy:

```bash
cd /srv/uzt-strategy-src
sudo bash deploy/deploy.sh
```

The standard deploy script already creates release snapshots and database backups. Use the latest backup from `/srv/uzt-backups/database` and the latest release snapshot from `/srv/uzt-backups/releases` if a manual rollback is required.
