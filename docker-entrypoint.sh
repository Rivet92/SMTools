#!/bin/sh
set -euo pipefail

if [ -z "${ConnectionStrings__DefaultConnection:-}" ]; then
    echo "ERROR: ConnectionStrings__DefaultConnection is not set."
    echo "Set it via environment variable or ensure POSTGRES_* variables are configured."
    exit 1
fi

PORT="${PORT:-8080}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:${PORT}}"
LEGAL_OWNER="${LEGAL_OWNER:-SMTools}"
LEGAL_EMAIL="${LEGAL_EMAIL:-admin@example.com}"
SHOW_DISCLAIMER="${SHOW_DISCLAIMER:-true}"
export ASPNETCORE_URLS="http://+:${PORT}"
export FRONTEND_ORIGIN="${FRONTEND_ORIGIN}"

# Inject runtime config into the pre-built SPA
if [ -f /app/wwwroot/index.html ]; then
  sed -i "s|__APP_URL__|${FRONTEND_ORIGIN}|g" /app/wwwroot/index.html
fi

# Write runtime legal config
cat > /app/wwwroot/legal.js <<EOF
window.__LEGAL_CONFIG__ = {
  owner: "${LEGAL_OWNER}",
  email: "${LEGAL_EMAIL}",
  showDisclaimer: ${SHOW_DISCLAIMER}
};
EOF

exec dotnet SMTools.Api.dll
