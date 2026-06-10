#!/bin/bash
# _start-cloudflared.command — démarre un tunnel TryCloudflare (anonyme, gratuit,
# sans page d'avertissement).
# Pré-requis : cloudflared installé (`brew install cloudflared`).

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_start-cloudflared.log"
URL_OUT="/Users/vinciaflora/Projects/renocalcpro-saas/_cloudflared-url.txt"
CF_LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_cloudflared.log"
exec > >(tee "$LOG") 2>&1

echo "==========================================="
echo "Démarrage cloudflared $(date)"
echo "==========================================="

CF_BIN="$(command -v cloudflared 2>/dev/null)"
if [ -z "$CF_BIN" ]; then
  for cand in /opt/homebrew/bin/cloudflared /usr/local/bin/cloudflared; do
    [ -x "$cand" ] && { CF_BIN="$cand"; break; }
  done
fi

if [ -z "$CF_BIN" ]; then
  echo "ERREUR : cloudflared non installé."
  echo "Installe-le : brew install cloudflared"
  echo "ABSENT" > "$URL_OUT"
  sleep 4
  exit 1
fi
echo "cloudflared : $CF_BIN"

# Vérifier qu'on a bien un serveur sur 3000
if ! lsof -ti:3000 >/dev/null 2>&1; then
  echo "AVERTISSEMENT : pas de serveur sur :3000."
fi

# Tuer un tunnel cloudflared précédent
pkill -f "cloudflared.*tunnel" 2>/dev/null || true
sleep 1

# Couper ngrok si actif (on bascule)
if pgrep -f "ngrok http" >/dev/null 2>&1; then
  echo "Arrêt du tunnel ngrok existant…"
  pkill -f "ngrok http" 2>/dev/null || true
  sleep 1
fi

# Lancer le tunnel en arrière-plan
echo "Lancement : $CF_BIN tunnel --url http://localhost:3000"
"$CF_BIN" tunnel --url http://localhost:3000 > "$CF_LOG" 2>&1 &
CF_PID=$!
echo "PID cloudflared : $CF_PID"

# Attendre que l'URL trycloudflare apparaisse dans le log
echo "Attente de l'URL publique TryCloudflare…"
URL=""
for i in $(seq 1 30); do
  URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -1)
  [ -n "$URL" ] && break
  sleep 1
done

if [ -n "$URL" ]; then
  echo
  echo "==========================================="
  echo "URL PUBLIQUE : $URL"
  echo "==========================================="
  echo "$URL" > "$URL_OUT"

  echo
  echo "Pages à tester sur ton tel (sans avertissement) :"
  echo "  $URL/fr"
  echo "  $URL/fr/contact"
  echo "  $URL/fr/p/dashboard"
  echo "  $URL/fr/tarifs"
  echo "  $URL/fr/p/projects/demo-projet-1/synthese"
  echo
  echo "Tunnel actif (PID $CF_PID). Pour l'arrêter : pkill -f 'cloudflared.*tunnel'"
else
  echo "ERREUR : aucune URL trycloudflare obtenue."
  echo "Détails dans $CF_LOG"
  echo "NO_URL" > "$URL_OUT"
  tail -30 "$CF_LOG"
fi

sleep 4
exit 0
