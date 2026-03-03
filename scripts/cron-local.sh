#!/usr/bin/env bash
# Triggers the cron endpoint against the local dev server.
# Usage: npm run cron:local

set -euo pipefail

# Extract CRON_SECRET from .env.local
CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | head -1 | sed 's/^CRON_SECRET=//;s/"//g')

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not found in .env.local"
  exit 1
fi

echo "Calling GET http://localhost:3000/api/cron ..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron

