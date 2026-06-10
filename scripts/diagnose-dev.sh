#!/usr/bin/env bash
set +e
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

REPORT="diagnose-$(date +%Y%m%d-%H%M%S).log"
echo "📋 Diagnostic Next.js — sortie : $REPORT"

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then TIMEOUT_CMD="timeout"; fi
if [ -z "$TIMEOUT_CMD" ] && command -v gtimeout >/dev/null 2>&1; then TIMEOUT_CMD="gtimeout"; fi

run_with_timeout() {
  local sec=$1; shift
  if [ -n "$TIMEOUT_CMD" ]; then
    $TIMEOUT_CMD "$sec" "$@"
  else
    "$@" &
    local pid=$!
    ( sleep "$sec"; kill -TERM "$pid" 2>/dev/null; sleep 2; kill -KILL "$pid" 2>/dev/null ) &
    local watchdog=$!
    wait "$pid" 2>/dev/null
    kill "$watchdog" 2>/dev/null
  fi
}

{
  echo "===== DIAGNOSTIC RENOCALCPRO — $(date) ====="
  echo "## 1. Versions"
  node --version 2>&1
  npm --version 2>&1

  echo ""
  echo "## 2. Fichiers critiques"
  for f in \
    src/app/layout.tsx src/app/page.tsx \
    src/app/[locale]/layout.tsx src/middleware.ts \
    src/components/pwa/RegisterSW.tsx \
    src/components/observability/PlausibleScript.tsx \
    src/lib/security/rateLimit.ts \
    src/i18n/routing.ts src/i18n/request.ts \
    next.config.mjs tsconfig.json package.json
  do
    if [ -f "$f" ]; then
      printf "  %6s bytes  %s\n" "$(wc -c < "$f")" "$f"
    else
      echo "  MANQUANT  $f"
    fi
  done

  echo ""
  echo "## 3. next.config.mjs (contenu intégral)"
  echo "----"
  cat next.config.mjs 2>&1
  echo "----"

  echo ""
  echo "## 4. Cleanup .next"
  rm -rf .next
  echo "  .next supprimé"

  echo ""
  echo "## 5. Tentative BUILD (kill après 90s)"
  echo "----"
  run_with_timeout 90 npx --no-install next build 2>&1 | tail -120
  echo "----"

  echo ""
  echo "## 6. Tentative DEV (kill après 12s — capture boot)"
  echo "----"
  rm -rf .next
  run_with_timeout 12 npx --no-install next dev 2>&1 | head -80
  echo "----"

  echo ""
  echo "===== FIN DIAGNOSTIC ====="
} > "$REPORT" 2>&1

echo "✅ Rapport : $REPORT"
echo ""
echo "Aperçu (60 dernières lignes) :"
echo "---"
tail -60 "$REPORT"
