#!/bin/sh
set -e

# Push the Prisma schema to the database on boot (retry until DB is reachable).
# The DB may still be starting when the app container comes up, so we retry.
echo "[entrypoint] Applying Prisma schema (db push)..."
i=0
until node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; do
  i=$((i+1))
  if [ "$i" -ge 12 ]; then
    echo "[entrypoint] prisma db push failed after $i attempts — starting server anyway."
    break
  fi
  echo "[entrypoint] db push failed (attempt $i). Retrying in 5s..."
  sleep 5
done

echo "[entrypoint] Starting Next.js server..."
exec node server.js
