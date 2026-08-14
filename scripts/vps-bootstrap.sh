#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# RENOCALCPRO — VPS bootstrap (Debian 12 / Ubuntu 22.04 LTS)
# ════════════════════════════════════════════════════════════════════════
# À lancer EN ROOT, une seule fois, sur un VPS OVH fraîchement provisionné.
# Idempotent : peut être relancé sans casser quoi que ce soit.
#
# Effets :
#   1. MAJ système, paquets de base (curl, gnupg, fail2ban, ufw, etc.)
#   2. Hardening SSH (désactive password auth, root login)
#   3. Pare-feu ufw : ouvre 22 / 80 / 443, ferme tout le reste
#   4. fail2ban : protection brute-force SSH
#   5. Installation Docker CE + Compose v2 plugin
#   6. Création utilisateur `renocal` (sans mot de passe, clé SSH copiée
#      depuis root), ajout au groupe docker
#   7. Préparation /opt/renocal (chown renocal:renocal)
#   8. Configuration journald rotation (évite saturation /var/log)
#   9. Active unattended-upgrades pour sécurité auto
#
# Usage :
#   curl -fsSL https://raw.githubusercontent.com/Vaethicsgroup/renocalcpro-saas/main/scripts/vps-bootstrap.sh | bash
#   # OU, après scp du fichier :
#   sudo bash vps-bootstrap.sh
#
# Étapes suivantes (manuelles, voir docs/DEPLOYMENT.md) :
#   - sudo -u renocal -i
#   - cd /opt/renocal && git clone <repo> .
#   - cp .env.example .env.production && nano .env.production
#   - ./scripts/deploy.sh
# ════════════════════════════════════════════════════════════════════════

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Ce script doit être lancé en root (sudo bash vps-bootstrap.sh)"
  exit 1
fi

log() { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn(){ printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }

# ─── 1. MAJ système ─────────────────────────────────────────────────────
log "1/9 · Mise à jour des paquets système"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget gnupg ca-certificates lsb-release apt-transport-https \
  ufw fail2ban unattended-upgrades \
  htop iotop tmux vim git \
  openssl jq tree
ok "système à jour"

# ─── 2. Hardening SSH ───────────────────────────────────────────────────
log "2/9 · Hardening SSH (désactivation password auth + root login)"
SSHD=/etc/ssh/sshd_config
cp -n "$SSHD" "${SSHD}.orig" 2>/dev/null || true
sed -i -E 's/^#?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD"
sed -i -E 's/^#?PermitRootLogin.*/PermitRootLogin prohibit-password/' "$SSHD"
sed -i -E 's/^#?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "$SSHD"
sed -i -E 's/^#?UsePAM.*/UsePAM yes/' "$SSHD"
# Optionnel — durcissement supplémentaire
grep -q "^Protocol 2" "$SSHD" || echo "Protocol 2" >> "$SSHD"
grep -q "^MaxAuthTries 3" "$SSHD" || echo "MaxAuthTries 3" >> "$SSHD"
grep -q "^ClientAliveInterval 300" "$SSHD" || echo "ClientAliveInterval 300" >> "$SSHD"
grep -q "^ClientAliveCountMax 2" "$SSHD" || echo "ClientAliveCountMax 2" >> "$SSHD"
systemctl restart sshd
ok "SSH durci"

# ─── 3. Pare-feu ufw ────────────────────────────────────────────────────
log "3/9 · Pare-feu ufw (22, 80, 443)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy redirect → 443)'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose
ok "ufw configuré"

# ─── 4. fail2ban (SSH brute-force) ──────────────────────────────────────
log "4/9 · fail2ban (jail SSH)"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = 22
EOF
systemctl restart fail2ban
systemctl enable fail2ban
ok "fail2ban actif"

# ─── 5. Docker CE + Compose v2 ──────────────────────────────────────────
log "5/9 · Docker CE + Compose v2"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
fi
docker --version
docker compose version
ok "Docker prêt"

# ─── 6. Utilisateur dédié `renocal` ─────────────────────────────────────
log "6/9 · Utilisateur applicatif `renocal`"
if ! id -u renocal >/dev/null 2>&1; then
  adduser --disabled-password --gecos "Renocal" renocal
fi
usermod -aG docker renocal
# Copie de la clé SSH root → renocal (permet de se connecter directement à renocal@vps)
if [ -f /root/.ssh/authorized_keys ]; then
  install -d -m 700 -o renocal -g renocal /home/renocal/.ssh
  install -m 600 -o renocal -g renocal /root/.ssh/authorized_keys /home/renocal/.ssh/authorized_keys
  ok "clé SSH copiée pour renocal"
else
  warn "/root/.ssh/authorized_keys absent — ajoute manuellement la clé pour renocal"
fi
ok "utilisateur renocal prêt"

# ─── 7. Répertoire applicatif ───────────────────────────────────────────
log "7/9 · /opt/renocal"
install -d -m 755 -o renocal -g renocal /opt/renocal
# Volumes Docker persistants (Postgres, Redis, Caddy, uploads, backups)
for vol in postgres redis caddy-data caddy-config uploads backups; do
  install -d -m 755 -o renocal -g renocal "/opt/renocal/volumes/${vol}"
done
ok "/opt/renocal créé"

# ─── 8. journald rotation ───────────────────────────────────────────────
log "8/9 · Rotation des logs journald (max 500M)"
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/00-renocal.conf <<'EOF'
[Journal]
SystemMaxUse=500M
SystemKeepFree=1G
RuntimeMaxUse=200M
EOF
systemctl restart systemd-journald
ok "journald limité à 500M"

# ─── 9. Unattended-upgrades (sécurité) ──────────────────────────────────
log "9/9 · unattended-upgrades (auto MAJ sécurité)"
dpkg-reconfigure --priority=low --frontend=noninteractive unattended-upgrades || true
ok "auto MAJ sécurité activée"

# ─── Bilan ──────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ VPS prêt — bootstrap terminé"
echo "════════════════════════════════════════════════════════════════════════"
echo
echo "Vérifs rapides :"
echo "  - ufw status                  → 22/80/443 LIMIT/ALLOW, le reste DENY"
echo "  - systemctl status fail2ban   → active (running)"
echo "  - docker ps                   → liste vide (normal, rien lancé)"
echo "  - id renocal                  → uid + groupe docker"
echo
echo "Étapes suivantes :"
echo "  1. Connecte-toi en renocal :"
echo "       ssh renocal@$(curl -s ifconfig.me)"
echo
echo "  2. Clone le repo :"
echo "       cd /opt/renocal"
echo "       git clone https://github.com/Vaethicsgroup/renocalcpro-saas.git ."
echo
echo "  3. Configure l'environnement :"
echo "       cp .env.example .env.production"
echo "       echo \"AUTH_SECRET=\$(openssl rand -base64 64)\" >> .env.production"
echo "       echo \"AUDIT_HMAC_KEY=\$(openssl rand -hex 32)\" >> .env.production"
echo "       chmod 600 .env.production"
echo "       nano .env.production   # remplir les valeurs Lot A/B/C de CREDENTIALS.md"
echo
echo "  4. Configure les DNS chez OVH (AVANT de lancer Caddy) :"
echo "       renocalcpro.fr       A     $(curl -s ifconfig.me)"
echo "       www.renocalcpro.fr   A     $(curl -s ifconfig.me)"
echo "     Vérifie : dig +short renocalcpro.fr  (doit retourner ton IP)"
echo
echo "  5. Préflight + déploiement :"
echo "       ./scripts/preflight-check.sh   # valide env / DNS / connectivité DB"
echo "       ./scripts/deploy.sh             # build, migrate, démarrer"
echo
echo "  6. Smoke test post-deploy :"
echo "       ./scripts/smoke-test.sh"
echo
echo "Documentation complète : docs/DEPLOYMENT.md + docs/RUNBOOK.md"
echo "════════════════════════════════════════════════════════════════════════"
