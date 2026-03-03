#!/usr/bin/env bash
set -euo pipefail

# ── Check for mongodump ──────────────────────────────────────────────
if ! command -v mongodump &>/dev/null; then
  echo "❌ mongodump not found."
  echo "   Install via: brew install mongodb-database-tools"
  exit 1
fi

# ── Parse flags ───────────────────────────────────────────────────────
SOURCE="prod"  # default: backup from prod
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local) SOURCE="local"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Read MONGODB_URI from .env.local ─────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env.local not found at $ENV_FILE"
  exit 1
fi

# Grab both URIs (active + commented) from .env.local
ACTIVE_URI=$(grep -E '^MONGODB_URI=' "$ENV_FILE" | head -1 | sed 's/^MONGODB_URI=//' | tr -d '"' | tr -d "'")
COMMENTED_URI=$(grep -E '^#\s*MONGODB_URI=' "$ENV_FILE" | head -1 | sed 's/^#\s*MONGODB_URI=//' | tr -d '"' | tr -d "'")

# Classify which is prod (atlas) and which is local
classify_uri() {
  if [[ "$1" == *"mongodb+srv"* || "$1" == *"mongodb.net"* ]]; then
    echo "prod"
  else
    echo "local"
  fi
}

PROD_URI="" LOCAL_URI=""
for uri in "$ACTIVE_URI" "$COMMENTED_URI"; do
  [[ -z "$uri" ]] && continue
  case "$(classify_uri "$uri")" in
    prod)  PROD_URI="$uri" ;;
    local) LOCAL_URI="$uri" ;;
  esac
done

if [[ "$SOURCE" == "prod" ]]; then
  MONGODB_URI="$PROD_URI"
else
  MONGODB_URI="$LOCAL_URI"
fi

if [[ -z "$MONGODB_URI" ]]; then
  echo "❌ No $SOURCE MONGODB_URI found in .env.local"
  exit 1
fi

# ── Set up output directory (one level above repo: ../dbdumps/YYMMDD) ─
DUMP_DATE=$(date +"%y%m%d")
DUMP_DIR="$PROJECT_ROOT/../dbdumps/$DUMP_DATE"

mkdir -p "$DUMP_DIR"

echo "🗄️  Dumping MongoDB ($SOURCE) to: $DUMP_DIR"
echo ""

# ── Run mongodump ────────────────────────────────────────────────────
mongodump --uri="$MONGODB_URI" --out="$DUMP_DIR"

echo ""
echo "✅ Backup complete → $DUMP_DIR"
echo ""
# Print summary of what was dumped
du -sh "$DUMP_DIR"/*/ 2>/dev/null || du -sh "$DUMP_DIR"



