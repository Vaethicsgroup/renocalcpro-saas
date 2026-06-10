#!/bin/bash
# _start-ngrok.command — démarre un tunnel ngrok sur le port 3000
# et publie l'URL publique dans _ngrok-url.txt

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_start-ngrok.log"
URL_OUT="/Users/vinciaflora/Projects/renocalcpro-saas/_ngrok-url.txt"
NGROK_LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_ngrok.log"
exec > >(tee "$LOG") 2>&1

echo "==========================================="
echo "Démarrage ngrok $(date)"
echo "==========================================="

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

# 1. Détecter ngrok dans le PATH ou via brew
NGROK_BIN="$(command -v ngrok 2>/dev/null)"
if [ -z "$NGROK_BIN" ]; then
  for candidate in /opt/homebrew/bin/ngrok /usr/local/bin/ngrok /opt/local/bin/ngrok; do
    if [ -x "$candidate" ]; then NGROK_BIN="$candidate"; break; fi
  done
fi

if [ -z "$NGROK_BIN" ]; then
  echo "ERREUR : ngrok introuvable dans le PATH ni dans /opt/homebrew/bin/, /usr/local/bin/, /opt/local/bin/"
  echo "Installe-le avec : brew install ngrok"
  echo "ABSENT_NGROK" > "$URL_OUT"
  sleep 4
  exit 1
fi
echo "ngrok détecté : $NGROK_BIN"

# 2. Vérifier que le serveur dev tourne sur 3000
if ! lsof -ti:3000 >/dev/null 2>&1; then
  echo "AVERTISSEMENT : aucun serveur sur le port 3000 — tunnel sera ouvert mais n'aura rien à servir."
fi

# 3. Tuer un tunnel ngrok précédent (s'il existe) — ngrok ne tolère qu'une session active
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

# 4. Démarrer ngrok en arrière-plan
echo "Lancement : $NGROK_BIN http 3000 --log=stdout"
"$NGROK_BIN" http 3000 --log=stdout --log-format=json > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!
echo "PID ngrok : $NGROK_PID"

# 5. Attendre que l'API locale de ngrok (4040) soit prête
echo "Attente de l'API ngrok sur 127.0.0.1:4040…"
for i in $(seq 1 20); do
  if curl -s --max-time 1 http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    echo "API ngrok OK après ${i}s"
    break
  fi
  sleep 1
done

# 6. Extraire l'URL publique HTTPS
RESP=$(curl -s --max-time 5 http://127.0.0.1:4040/api/tunnels)
echo "Réponse API :"
echo "$RESP" | head -c 2000
echo

# Parse JSON via python (présent sur macOS par défaut)
URL=$(python3 -c "
import json, sys
try:
    data = json.loads(sys.argv[1])
    for t in data.get('tunnels', []):
        if t.get('proto') == 'https' or t.get('public_url', '').startswith('https://'):
            print(t['public_url'])
            sys.exit(0)
    # Fallback : prendre n'importe lequel
    for t in data.get('tunnels', []):
        print(t.get('public_url', ''))
        sys.exit(0)
except Exception as e:
    sys.stderr.write(str(e))
" "$RESP" 2>/dev/null)

if [ -n "$URL" ]; then
  echo
  echo "==========================================="
  echo "URL PUBLIQUE : $URL"
  echo "==========================================="
  echo "$URL" > "$URL_OUT"
else
  echo "ERREUR : aucune URL extraite. Détails dans $NGROK_LOG"
  echo "NO_URL" > "$URL_OUT"
fi

echo
echo "Le tunnel ngrok tourne maintenant en arrière-plan (PID $NGROK_PID)."
echo "Pour arrêter : pkill -f 'ngrok http'"
sleep 4
exit 0
