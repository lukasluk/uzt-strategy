#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/srv/uzt-strategy
FRONT_DIR=/var/www/uzt-strategy
SRC_DIR=/srv/uzt-strategy-src

mkdir -p "$APP_DIR" "$FRONT_DIR"

rsync -az --delete "$SRC_DIR/prototype/" "$FRONT_DIR/"
# Preserve runtime env file on server (it must not be stored in git).
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

sudo cp "$SRC_DIR/deploy/uzt-strategy-api.service" /etc/systemd/system/uzt-strategy-api.service
sudo cp "$SRC_DIR/deploy/nginx.conf" /etc/nginx/sites-available/uzt-strategy
sudo ln -sfn /etc/nginx/sites-available/uzt-strategy /etc/nginx/sites-enabled/uzt-strategy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

sudo systemctl daemon-reload
sudo systemctl enable uzt-strategy-api
sudo systemctl reload nginx
sudo systemctl restart uzt-strategy-api
