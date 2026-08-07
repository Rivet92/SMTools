#!/usr/bin/env bash
# deploy.sh — deploys an immutable image tag (sha-<short>) and rolls back
# automatically if the container does not become healthy.
#
# Usage: ./deploy.sh <short-sha>
#
# State files (in the same directory):
#   .tag            current deployed sha (written only after a successful deploy)
#   .tag.previous   previous deployed sha (used by rollback.sh)
#
# The image tag is passed to compose via IMAGE_TAG; the compose file reads
# ${IMAGE_TAG:-latest}, so deploys never depend on the `latest` tag.
set -euo pipefail

TAG="sha-${1:?usage: deploy.sh <short-sha>}"
BASE_DIR="/opt/smtools"
CONTAINER="smtools-app"
TIMEOUT_LOOPS=30
SLEEP_SECS=5

cd "$BASE_DIR"

PREV="$(cat .tag 2>/dev/null || echo none)"
if [ "$PREV" = "none" ]; then
  echo "[deploy] First deploy detected (no .tag file yet)."
else
  echo "$PREV" > .tag.previous
fi

echo "[deploy] Pulling $TAG (previous: $PREV)"
docker compose pull app

echo "[deploy] Starting container"
IMAGE_TAG="$TAG" docker compose up -d app

wait_healthy() {
  local label="$1"
  for i in $(seq 1 "$TIMEOUT_LOOPS"); do
    state="$(docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo missing)"
    if [ "$state" != "running" ]; then
      echo "[deploy] $CONTAINER is not running (state: $state)."
      return 1
    fi
    status="$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo starting)"
    if [ "$status" = "healthy" ]; then
      echo "[deploy] $label is healthy."
      return 0
    fi
    if [ "$status" = "unhealthy" ]; then
      echo "[deploy] $label marked unhealthy."
      return 1
    fi
    sleep "$SLEEP_SECS"
  done
  echo "[deploy] $label did not become healthy in time."
  return 1
}

if wait_healthy "$TAG"; then
  echo "$TAG" > .tag
  echo "[deploy] Deployed $TAG (previous: $PREV)"
  exit 0
fi

echo "[deploy] Health check failed for $TAG."

if [ "$PREV" != "none" ]; then
  echo "[deploy] Rolling back to $PREV"
  IMAGE_TAG="$PREV" docker compose pull app
  if IMAGE_TAG="$PREV" docker compose up -d app && wait_healthy "$PREV"; then
    echo "$PREV" > .tag
    echo "[deploy] Rolled back to $PREV. Deployment marked as failed."
    exit 1
  fi
  echo "[deploy] Rollback to $PREV also failed. Manual intervention required: ./status.sh"
else
  echo "[deploy] No previous version available. Manual intervention required: ./status.sh"
fi

exit 1
