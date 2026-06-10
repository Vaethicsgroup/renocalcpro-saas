#!/bin/bash
# ─── Validation pré-déploiement SaaS ────────────────────────────────────────
# À lancer côté macOS avant le déploiement OVH.
# Vérifie : install OK, typecheck strict OK, lint OK, audit deps OK.

set -e
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  if [ -x /opt/homebrew/bin/node ]; then export PATH="/opt/homebrew/bin:$PATH"; fi
  if [ -x /usr/local/bin/node ]; then export PATH="/usr/local/bin:$PATH"; fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "   RÉNO·CALC PRO SAAS — Validation pré-déploiement"
echo "════════════════════════════════════════════════════════"
echo ""

# 1. Install
if [ ! -d "node_modules" ] || [ ! -x "node_modules/.bin/tsc" ]; then
  echo "📦 npm install (3-5 min, première fois)…"
  rm -rf node_modules package-lock.json
  npm install --no-audit --no-fund --legacy-peer-deps
  echo ""
fi

# 2. Génère le client Prisma (nécessaire pour typecheck)
echo "🔧 prisma generate…"
npx prisma generate
echo ""

# 3. Typecheck strict
echo "🧪 npm run typecheck (TypeScript strict)…"
if npm run typecheck; then
  echo "  ✓ typecheck OK"
else
  echo "  ✗ typecheck FAILED — corriger avant deploy"
  exit 1
fi
echo ""

# 4. Lint
echo "🧹 npm run lint…"
if npm run lint; then
  echo "  ✓ lint OK"
else
  echo "  ⚠ lint warnings — non bloquant mais à examiner"
fi
echo ""

# 5. Audit deps
echo "🔒 npm audit (level high+)…"
if npm audit --audit-level=high --production; then
  echo "  ✓ audit OK (zéro CVE high+)"
else
  echo "  ⚠ vulnerabilities détectées — examiner avec npm audit"
fi
echo ""

# 6. Format check
echo "🎨 prettier --check…"
if npm run format:check 2>/dev/null; then
  echo "  ✓ format OK"
fi
echo ""

# 7. Secrets scan (si gitleaks installé)
if command -v gitleaks >/dev/null 2>&1; then
  echo "🔍 gitleaks detect…"
  gitleaks detect --no-banner --redact || echo "  ⚠ secrets détectés"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Validation terminée"
echo "════════════════════════════════════════════════════════"
echo ""
read -n 1 -s -r -p "Appuyez sur une touche pour fermer…"
