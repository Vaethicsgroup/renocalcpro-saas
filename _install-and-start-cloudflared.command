#!/bin/bash
# _install-and-start-cloudflared.command
# Télécharge le binaire cloudflared officiel depuis github.com/cloudflare/cloudflared
# et démarre un tunnel TryCloudflare anonyme vers localhost:3000.
# Aucune installation Brew requise.

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_install-and-start-cloudflared.log"
URL_OUT="/Users/vinciaflora/Projects/renocalcpro-saas/_cloudflared-url.txt"
CF_LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_cloudflared.log"
exec > >(tee "$LOG") 2>&1

echo "==========================================="
echo "Install + start cloudflared $(date)"
echo "==========================================="

BIN_DIR="/Users/vinciaflora/Projects/renocalcpro-saas/_bin"
mkdir -p "$BIN_DIR"
CF_BIN="$BIN_DIR/cloudflared"

# 1. Détecter cloudflared déjà installé (homebrew ou téléchargé)
if [ -x "$CF_BIN" ]; then
  echo "✓ cloudflared local déjà téléchargé : $CF_BIN"
else
  EXISTING="$(command -v cloudflared 2>/dev/null)"
  if [ -z "$EXISTING" ]; then
    for cand in /opt/homebrew/bin/cloudflared /usr/local/bin/cloudflared; do
      [ -x "$cand" ] && { EXISTING="$cand"; break; }
    done
  fi
  if [ -n "$EXISTING" ]; then
    echo "✓ cloudflared système déjà présent : $EXISTING"
    CF_BIN="$EXISTING"
  else
    # 2. Télécharger le binaire depuis github releases
    ARCH="$(uname -m)"
    case "$ARCH" in
      arm64)  ASSET="cloudflared-darwin-arm64.tgz" ;;
      x86_64) ASSET="cloudflared-darwin-amd64.tgz" ;;
      *) echo "✗ Architecture macOS inconnue : $ARCH"; exit 1 ;;
    esac
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/$ASSET"
    echo "Téléchargement : $URL"
    curl -sSL -o "/tmp/cloudflared.tgz" "$URL"
    if [ ! -s /tmp/cloudflared.tgz ]; then
      echo "✗ Téléchargement échoué."
      echo "NO_BINARY" > "$URL_OUT"
      exit 1
    fi
    tar -xzf /tmp/cloudflared.tgz -C "$BIN_DIR"
    chmod +x "$CF_BIN"
    if [ ! -x "$CF_BIN" ]; then
      echo "✗ Binaire extrait non exécutable."
      ls -la "$BIN_DIR"
      exit 1
    fi
    echo "✓ Téléchargé et installé dans $CF_BIN"
  fi
fi

"$CF_BIN" --version 2>/dev/null || true

# 3. Vérifier le serveur dev
if ! lsof -ti:3000 >/dev/null 2>&1; then
  echo "AVERTISSEMENT : pas de dev server sur :3000."
fi

# 4. Tuer tunnels existants
pkill -f "cloudflared.*tunnel" 2>/dev/null || true
sleep 1
if pgrep -f "ngrok http" >/dev/null 2>&1; then
  echo "Arrêt ngrok…"
  pkill -f "ngrok http" 2>/dev/null || true
  sleep 1
fi

# 5. Lancer le tunnel
echo "Lancement : $CF_BIN tunnel --url http://localhost:3000"
"$CF_BIN" tunnel --url http://localhost:3000 > "$CF_LOG" 2>&1 &
CF_PID=$!
echo "PID cloudflared : $CF_PID"

# 6. Attendre l'URL TryCloudflare
echo "Attente de l'URL publique TryCloudflare…"
URL=""
for i in $(seq 1 40); do
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
  echo "Pages à tester sur ton iPhone :"
  echo "  $URL/fr"
  echo "  $URL/fr/contact"
  echo "  $URL/fr/p/dashboard"
  echo "  $URL/fr/tarifs"
  echo "  $URL/fr/p/projects/demo-projet-1/synthese"
else
  echo "ERREUR : aucune URL trycloudflare obtenue après 40s."
  echo "Détails du log cloudflared :"
  tail -40 "$CF_LOG"
  echo "NO_URL" > "$URL_OUT"
fi

sleep 4
exit 0
