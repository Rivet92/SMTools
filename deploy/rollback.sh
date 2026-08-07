#!/usr/bin/env bash
# rollback.sh — redeploys the previous image tag recorded in .tag.previous.
#
# Usage: ./rollback.sh
# To roll back to an arbitrary commit, use: ./deploy.sh <short-sha>
set -euo pipefail

cd /opt/smtools

TAG="$(cat .tag.previous 2>/dev/null || echo '')"
if [ -z "$TAG" ]; then
  echo "[rollback] No previous tag found in .tag.previous. Nothing to roll back to."
  exit 1
fi

echo "[rollback] Rolling back to $TAG"
exec ./deploy.sh "$TAG"
