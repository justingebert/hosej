#!/usr/bin/env bash
set -euo pipefail

# ── Check for mongorestore ───────────────────────────────────────────
if ! command -v mongorestore &>/dev/null; then
  echo "❌ mongorestore not found."
  echo "   Install via: brew install mongodb-database-tools"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMPS_DIR="$PROJECT_ROOT/../dbdumps"
ENV_FILE="$PROJECT_ROOT/.env.local"

# ── Resolve local MongoDB URI from .env.local ────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env.local not found at $ENV_FILE"
  exit 1
fi

ACTIVE_URI=$(grep -E '^MONGODB_URI=' "$ENV_FILE" | head -1 | sed 's/^MONGODB_URI=//' | tr -d '"' | tr -d "'")
COMMENTED_URI=$(grep -E '^#\s*MONGODB_URI=' "$ENV_FILE" | head -1 | sed 's/^#\s*MONGODB_URI=//' | tr -d '"' | tr -d "'")

classify_uri() {
  if [[ "$1" == *"mongodb+srv"* || "$1" == *"mongodb.net"* ]]; then
    echo "prod"
  else
    echo "local"
  fi
}

LOCAL_URI=""
for uri in "$ACTIVE_URI" "$COMMENTED_URI"; do
  [[ -z "$uri" ]] && continue
  if [[ "$(classify_uri "$uri")" == "local" ]]; then
    LOCAL_URI="$uri"
    break
  fi
done

if [[ -z "$LOCAL_URI" ]]; then
  echo "❌ No local MONGODB_URI found in .env.local"
  exit 1
fi

# ── Pick dump to restore (optional positional arg) ───────────────────
if [[ -n "${1:-}" ]]; then
  # Argument given: use as dump folder name (e.g. "260303" or full path)
  if [[ -d "$1" ]]; then
    DUMP_DIR="$1"
  elif [[ -d "$DUMPS_DIR/$1" ]]; then
    DUMP_DIR="$DUMPS_DIR/$1"
  else
    echo "❌ Dump not found: $1"
    exit 1
  fi
else
  # No argument: pick the most recent dump
  if [[ ! -d "$DUMPS_DIR" ]]; then
    echo "❌ No dumps directory found at $DUMPS_DIR"
    echo "   Run 'npm run db:backup' first."
    exit 1
  fi

  # List only folders that look like date dumps (6+ digit names), sort descending, pick newest
  DUMP_DIR=$(find "$DUMPS_DIR" -maxdepth 1 -mindepth 1 -type d | xargs -I{} basename {} | grep -E '^[0-9]{6,}$' | sort -r | head -1)

  if [[ -z "$DUMP_DIR" ]]; then
    echo "❌ No date-named dumps found in $DUMPS_DIR"
    echo "   Run 'npm run db:backup' first."
    exit 1
  fi

  DUMP_DIR="$DUMPS_DIR/$DUMP_DIR"
fi

# ── Find the database subfolder inside the dump ──────────────────────
# mongodump creates <out>/<dbname>/, find it automatically
DB_FOLDER=$(find "$DUMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -1)
SOURCE_DB="${DB_FOLDER:+$(basename "$DB_FOLDER")}"

if [[ -z "$DB_FOLDER" || -z "$SOURCE_DB" ]]; then
  echo "❌ No database folder found inside $DUMP_DIR"
  exit 1
fi

# ── Resolve target DB name from local URI ────────────────────────────
# Extract DB name from URI path, e.g. mongodb://localhost:27017/hosej → hosej
TARGET_DB=$(echo "$LOCAL_URI" | sed -E 's|.*://[^/]+/([^?]+).*|\1|')
if [[ -z "$TARGET_DB" || "$TARGET_DB" == "$LOCAL_URI" ]]; then
  TARGET_DB="$SOURCE_DB"
fi

NEEDS_REMAP=false
if [[ "$SOURCE_DB" != "$TARGET_DB" ]]; then
  NEEDS_REMAP=true
fi

echo "📦 Restoring dump: $DUMP_DIR"
echo "   Source DB: $SOURCE_DB"
if [[ "$NEEDS_REMAP" == true ]]; then
  echo "   Target DB: $TARGET_DB (remapped from $SOURCE_DB)"
else
  echo "   Target DB: $TARGET_DB"
fi
echo "   URI:       $LOCAL_URI"
echo ""
read -rp "⚠️  This will DROP the local '$TARGET_DB' database. Continue? [y/N] " confirm
if [[ "$confirm" != [yY] ]]; then
  echo "Aborted."
  exit 0
fi

echo ""

# ── Run mongorestore ─────────────────────────────────────────────────
# Point mongorestore at the DB subfolder (e.g. 260303/test/) and use
# --db to control which local database receives the data.
mongorestore --uri="$LOCAL_URI" --drop --db="$TARGET_DB" "$DB_FOLDER"

echo ""
echo "✅ Restore complete → $LOCAL_URI/$TARGET_DB"






