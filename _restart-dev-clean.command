#!/bin/bash
# _restart-dev-clean.command — kill dev, vide .next, redémarre dev propre

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_restart-dev-clean.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Restart dev clean $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1. Kill anything on port 3000
PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Killing PID $PID sur port 3000…"
  kill -9 $PID 2>/dev/null || true
  sleep 2
fi

# 2. Vider .next cache
echo "Suppression .next cache…"
rm -rf .next
echo "✓ .next purgé"

# 3. Redémarrer dev en background, log dans /tmp
echo "Lancement npm run dev en arrière-plan…"
nohup npm run dev > /tmp/nextjs-restart.log 2>&1 &
DEV_PID=$!
echo "Dev server PID : $DEV_PID"

# 4. Attendre que le port 3000 soit prêt
echo "Attente de la disponibilité du port 3000…"
for i in $(seq 1 30); do
  if curl -s --max-time 1 "http://localhost:3000/fr" > /dev/null 2>&1; then
    echo "✓ Port 3000 répond après ${i}s"
    break
  fi
  sleep 1
done

# 5. Tester /fr/contact spécifiquement
echo
echo "── Test /fr/contact ──"
CODE=$(curl -s -o /tmp/c.html --max-time 30 -w "%{http_code}" "http://localhost:3000/fr/contact")
SIZE=$(wc -c < /tmp/c.html 2>/dev/null | tr -d ' ')
echo "  HTTP $CODE / Taille $SIZE octets"

# 6. Vérifier que le CSS lié contient bien les nouvelles classes
CSS_URL=$(curl -s --max-time 30 "http://localhost:3000/fr/contact" | grep -oE '/_next/static/css/[^"?]+\.css' | head -1)
if [ -n "$CSS_URL" ]; then
  curl -s --max-time 30 -o /tmp/css2.txt "http://localhost:3000$CSS_URL"
  CSS_SIZE=$(wc -c < /tmp/css2.txt 2>/dev/null | tr -d ' ')
  echo "  CSS $CSS_URL : $CSS_SIZE octets"
  echo "  bg-night-800     : $(grep -c 'bg-night-800' /tmp/css2.txt)"
  echo "  bg-cream-50      : $(grep -c 'bg-cream-50' /tmp/css2.txt)"
  echo "  bg-terracotta-500: $(grep -c 'bg-terracotta-500' /tmp/css2.txt)"
  echo "  night-gradient   : $(grep -c 'night-gradient' /tmp/css2.txt)"
fi

# 7. Vérifier ngrok toujours actif
echo
echo "── Tunnel ngrok ──"
if pgrep -f "ngrok http" > /dev/null; then
  echo "  ✓ ngrok actif"
else
  echo "  ✗ ngrok arrêté — il faudra relancer _start-ngrok.command"
fi

echo
echo "==========================================="
echo "Dev server redémarré, prêt sur :3000"
echo "Tunnel : https://endorphin-banana-fracture.ngrok-free.dev"
echo "==========================================="

sleep 4
exit 0
