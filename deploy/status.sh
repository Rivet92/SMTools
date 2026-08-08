#!/usr/bin/env bash
# status.sh — shows exactly what version is deployed on this server.
#
# Usage: ./status.sh
set -euo pipefail

cd /opt/smtools
CONTAINER="smtools"

echo "tag file:        $(cat .tag 2>/dev/null || echo none)"
echo "previous tag:    $(cat .tag.previous 2>/dev/null || echo none)"
echo "container image: $(docker inspect --format '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || echo 'container not found')"
echo "commit revision: $(docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$CONTAINER" 2>/dev/null || echo '-')"
echo "health:          $(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo '-')"
echo "restarts:        $(docker inspect --format '{{.RestartCount}}' "$CONTAINER" 2>/dev/null || echo '-')"
