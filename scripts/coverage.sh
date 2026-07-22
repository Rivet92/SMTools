#!/usr/bin/env bash
set -euo pipefail

echo "=== Backend ==="
dotnet test tests/SMToolsBackend.Tests/SMToolsBackend.Tests.csproj \
  --collect:"XPlat Code Coverage" \
  --settings tests/SMToolsBackend.Tests/.runsettings \
  --verbosity quiet --nologo >/dev/null

cov_file=$(ls tests/SMToolsBackend.Tests/TestResults/*/coverage.cobertura.xml 2>/dev/null | head -1)
if [ -n "$cov_file" ]; then
  awk '/<coverage /{
    for(i=1;i<=NF;i++) {
      if($i ~ /line-rate=/) split($i,a,"\"");
      if($i ~ /branch-rate=/) split($i,b,"\"");
    }
    printf "  Line: %.1f%% | Branch: %.1f%%\n", a[2]*100, b[2]*100
  }' "$cov_file"
fi

echo ""
echo "=== Frontend ==="
pnpm --silent --filter frontend test:coverage | grep -A 10 "Coverage summary"
