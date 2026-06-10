# Déploiement Réno·Calc Pro SaaS sur OVH — Runbook

## 1. Vue d'ensemble

L'application est packagée en **container Docker Next.js standalone**. Elle tourne derrière **Caddy** (reverse proxy + TLS Let's Encrypt automatique). La pile prod : Caddy / Next.js / Postgres / Redis / ClamAV (sidecar antivirus).

Le domaine cible est **`renocalcpro.fr`** (déjà acquis sur OVH).

## 2. Pré-requis sur le serveur OVH

- VPS / Bare Metal sous Debian 12 ou Ubuntu 22.04 LTS
- 4 vCPU minimum (pour Puppeteer / @react-pdf en pic)
- 8 Go RAM minimum
- 80 Go SSD minimum (volumes Docker + backups locaux)
- Docker + Docker Compose v2 installés
- Ports 80 et 443 ouverts dans le pare-feu OVH
- Enregistrements DNS chez OVH :
  ```
  renocalcpro.fr.       A     <IP_SERVEUR>
  www.renocalcpro.fr.   A     <IP_SERVEUR>
  ```

## 3. Première installation

### 3.1 Provisionnement utilisateur dédié

```bash
adduser --disabled-password --gecos "Renocal" renocal
usermod -aG docker renocal
mkdir -p /opt/renocal && chown renocal:renocal /opt/renocal
```

### 3.2 Récupération du code

```bash
sudo -u renocal -i
cd /opt/renocal
git clone https://github.com/<org>/renocal-pro-saas.git .
```

### 3.3 Configuration de l'environnement

```bash
cp .env.example .env.production
# Génère les secrets requis :
echo "AUTH_SECRET=$(openssl rand -base64 64)" >> .env.production
echo "AUDIT_HMAC_KEY=$(openssl rand -hex 32)" >> .env.production
# Édite .env.production et remplis :
#   DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, S3_*, SMTP_*, etc.
chmod 600 .env.production
```

### 3.4 Génération du Caddyfile pour TLS

Caddy obtient automatiquement les certificats Let's Encrypt au premier démarrage. Vérifier que les DNS sont propagés AVANT de lancer.

### 3.5 Lancement initial

```bash
cd /opt/renocal
./scripts/deploy.sh
```

Le script :
- builde l'image
- lance les migrations Prisma
- démarre la stack
- vérifie le health-check

### 3.6 Vérifications post-deploy

- [ ] `https://renocalcpro.fr` répond 200
- [ ] Certificat TLS valide (Let's Encrypt) — `curl -I https://renocalcpro.fr`
- [ ] Headers de sécurité présents (`curl -I` doit montrer HSTS, CSP, X-Frame-Options DENY)
- [ ] `/api/health` répond `{"status":"ok"}`
- [ ] Logs Caddy : `docker compose logs -f caddy`
- [ ] Logs Next.js : `docker compose logs -f web`
- [ ] Test signup + magic-link reçu
- [ ] Upload photo → ClamAV scan OK

## 4. Mises à jour

```bash
cd /opt/renocal
git pull --ff-only
./scripts/deploy.sh
```

Le déploiement est **zero-downtime** : Caddy maintient les connexions actives pendant que le container `web` est remplacé.

## 5. Rollback rapide

```bash
./scripts/rollback.sh <previous_tag>
```

## 6. Backups

### 6.1 Automatique

Cron job sur le serveur (à mettre dans `/etc/cron.d/renocal-backup`) :

```cron
0 3 * * * renocal /opt/renocal/scripts/backup-prod.sh >> /var/log/renocal-backup.log 2>&1
```

Backups stockés sur OVH Object Storage chiffrés GPG AES256.

### 6.2 Restauration depuis un backup

```bash
# Téléchargement
aws s3 cp s3://${BACKUP_BUCKET}/postgres/${TS}/db.dump.gpg /tmp/restore.dump.gpg \
  --endpoint-url https://s3.gra.io.cloud.ovh.net

# Déchiffrement
gpg --batch --yes --passphrase "${BACKUP_GPG_PASSPHRASE}" \
    --decrypt /tmp/restore.dump.gpg > /tmp/restore.dump

# Restauration
docker compose -f deploy/docker-compose.prod.yml exec -T db \
  pg_restore -U ${POSTGRES_USER} -d ${POSTGRES_DB} --clean --if-exists < /tmp/restore.dump
```

## 7. Logs & monitoring

- Logs Caddy : `/data/access.log` (volume `caddy-data`)
- Logs Next.js : stdout / `docker compose logs -f web`
- Erreurs runtime : Sentry si `SENTRY_DSN` défini
- Métriques : à brancher sur Loki/Grafana ou OVH Monitoring (au choix)

## 8. Sécurité — checklist en production

- [ ] `.env.production` non commité, perm 600
- [ ] AUTH_SECRET et AUDIT_HMAC_KEY générés via openssl, jamais réutilisés
- [ ] `gitleaks detect` lance OK avant chaque deploy (hook pré-commit)
- [ ] Postgres : utilisateur applicatif sans rôle SUPERUSER
- [ ] Redis : password fort, pas exposé en dehors du réseau Docker
- [ ] ClamAV : signatures à jour (auto-update activé par défaut)
- [ ] Sauvegardes testées en restauration une fois par trimestre
- [ ] CSP testée via [securityheaders.com](https://securityheaders.com) — viser A+
- [ ] TLS testé via [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/) — viser A+
- [ ] Audit `npm audit --audit-level=moderate` zéro CVE
- [ ] Semgrep config OWASP Top 10 lance OK en CI
