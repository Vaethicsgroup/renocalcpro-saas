#!/bin/bash
# _probe-cloudflared.command — vérifie sans rien installer si cloudflared est dispo.
# À lancer SEULEMENT si le test mobile Safari échoue après le reset cache.

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_probe-cloudflared.log"
exec > >(tee "$LOG") 2>&1

echo "==========================================="
echo "Probe cloudflared $(date)"
echo "==========================================="

CF_BIN="$(command -v cloudflared 2>/dev/null)"
if [ -z "$CF_BIN" ]; then
  for cand in /opt/homebrew/bin/cloudflared /usr/local/bin/cloudflared; do
    [ -x "$cand" ] && { CF_BIN="$cand"; break; }
  done
fi

if [ -z "$CF_BIN" ]; then
  echo "✗ cloudflared NON installé."
  echo
  echo "Pour l'installer (commande à coller dans Terminal) :"
  echo "  brew install cloudflared"
  echo
  echo "Une fois installé, relancer ce probe pour confirmer, puis lancer"
  echo "_start-cloudflared.command pour ouvrir un tunnel anonyme (TryCloudflare)."
else
  echo "✓ cloudflared détecté : $CF_BIN"
  "$CF_BIN" --version 2>/dev/null || true
fi

# Vérifier que le dev server tourne sur 3000
echo
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "✓ dev server actif sur :3000"
else
  echo "✗ pas de serveur sur :3000 — relancer 'npm run dev' avant le tunnel"
fi

sleep 4
exit 0
