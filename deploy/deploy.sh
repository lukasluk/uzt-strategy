#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/srv/uzt-strategy
FRONT_DIR=/var/www/uzt-strategy

mkdir -p "" ""

rsync -az --delete prototype/ "/"
rsync -az --delete backend/ "/backend/"

cd "/backend"
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

sudo systemctl daemon-reload
sudo systemctl enable uzt-strategy-api
sudo systemctl restart uzt-strategy-api
sudo systemctl reload nginx
