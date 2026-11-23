# Phase 3 — Déploiement production OVH

Plan opérationnel pour mettre RenocalcPro en ligne sur `https://renocalcpro.fr`.
Référence : `docs/DEPLOYMENT.md` (runbook détaillé), `docs/RUNBOOK.md` (incidents).

## Ordre d'exécution recommandé

### J-7 — Provisioning (côté toi, environ 2 h)

**1. Commander le VPS OVH**
- Espace client OVH → VPS → Comfort 4 vCPU / 8 Go RAM / 80 Go SSD
- OS : Debian 12 ou Ubuntu 22.04 LTS
- Région : Gravelines (gra) ou Roubaix (rbx) — le plus proche de tes utilisateurs
- Note l'IP publique et la clé SSH root reçue

**2. Commander Postgres managé (recommandé) OU l'installer en local sur le VPS**
- OVH Public Cloud → Databases → PostgreSQL 15
- Plan "Essential" 2 GB suffit pour démarrer
- Récupère `host:port`, `user`, `password`, `database_name` → `DATABASE_URL`
- ⚠ Active SSL (sinon `?sslmode=require` dans l'URL)

**3. Object Storage OVH (S3-compatible)**
- OVH Public Cloud → Object Storage → S3 → Add a user
- Nom du bucket : `renocalcpro-prod` (ou ton choix)
- Récupère : `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Crée 2 sous-buckets : `uploads/` (photos clients) et `backups/` (dumps DB)

**4. Stripe production**
- Dashboard Stripe → Developers → API keys → **Reveal live key**
- Stripe → Webhooks → Add endpoint → `https://renocalcpro.fr/api/webhooks/stripe`
- Évènements à écouter : `checkout.session.completed`, `customer.subscription.*`,
  `invoice.payment_succeeded`, `invoice.payment_failed`
- Récupère la **signing secret** → `STRIPE_WEBHOOK_SECRET`

**5. Anthropic production**
- console.anthropic.com → API Keys → Create key → "renocalcpro-prod"
- Plafond de spend mensuel (ex 200 €) configuré côté billing
- → `ANTHROPIC_API_KEY`

**6. Sentry**
- sentry.io → New Project → Next.js → "renocalcpro-saas-prod"
- Récupère le DSN → `SENTRY_DSN`

**7. SMTP transactionnel**
- Recommandation : Postmark (UX excellente pour les magic links) OU
  Resend (gratuit jusqu'à 3 k mails/mois)
- Récupère : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Configure SPF + DKIM + DMARC dans la zone DNS OVH

### J-3 — DNS

**8. Configure les DNS chez OVH** (propagation 1-24 h)
```
renocalcpro.fr.       A     <IP_VPS>     TTL 600
www.renocalcpro.fr.   A     <IP_VPS>     TTL 600
```

Vérification depuis ton Mac :
```bash
dig +short renocalcpro.fr @8.8.8.8
dig +short www.renocalcpro.fr @8.8.8.8
```
Les deux doivent répondre `<IP_VPS>` avant de passer à l'étape suivante.

### Jour J — Déploiement (1-2 h)

**9. Bootstrap du VPS** (SSH en root la première fois)
```bash
ssh root@<IP_VPS>
curl -fsSL https://raw.githubusercontent.com/Vaethicsgroup/renocalcpro-saas/main/scripts/vps-bootstrap.sh | bash
```

Le script (`scripts/vps-bootstrap.sh`) installe Docker, configure le pare-feu
(22/80/443 only), durcit SSH, crée l'utilisateur `renocal`, active fail2ban
et unattended-upgrades. Idempotent.

**10. Bascule sur l'utilisateur applicatif**
```bash
ssh renocal@<IP_VPS>
cd /opt/renocal
git clone https://github.com/Vaethicsgroup/renocalcpro-saas.git .
```

**11. Configure l'environnement**
```bash
cp .env.example .env.production
chmod 600 .env.production
echo "AUTH_SECRET=$(openssl rand -base64 64)" >> .env.production
echo "AUDIT_HMAC_KEY=$(openssl rand -hex 32)" >> .env.production
echo "APP_VERSION=$(git rev-parse --short HEAD)" >> .env.production
nano .env.production    # Remplis les variables Lot A/B/C (cf. CREDENTIALS.md)
```

**12. Preflight check** (doit être vert avant deploy)
```bash
./scripts/preflight-check.sh
```

Si rouge : corrige les variables manquantes / DNS pas propagé / DB inaccessible.

**13. Premier déploiement**
```bash
./scripts/deploy.sh
```

Le script build l'image, applique les migrations Prisma, démarre la stack
(Caddy + web + Postgres local si pas managé + Redis + ClamAV), attend le
healthcheck. Caddy demande automatiquement le certificat Let's Encrypt
(prend 30-60 s — ne ferme PAS le terminal).

**14. Smoke test** (doit être vert)
```bash
./scripts/smoke-test.sh
```

Si une étape échoue → rollback immédiat :
```bash
./scripts/rollback.sh <previous_tag>
```

### J+1 — Monitoring continu

**15. Branch protection rules GitHub**
- Settings → Branches → Add rule on `main`
- Require pull request before merging (1 reviewer)
- Require status checks (CI build + tests)
- Restrict who can push (toi seulement)

**16. Backup cron**
Sur le VPS, en tant que root :
```bash
echo "0 3 * * * renocal /opt/renocal/scripts/backup-prod.sh >> /var/log/renocal-backup.log 2>&1" \
  > /etc/cron.d/renocal-backup
```

**17. Uptime monitoring externe**
- UptimeRobot (gratuit) : check toutes les 5 min sur `https://renocalcpro.fr/api/health`
- Alerte SMS/email si KO 2 fois consécutives

**18. Sentry release tracking**
Dans le pipeline de deploy, après push :
```bash
npx @sentry/cli releases new "$APP_VERSION"
npx @sentry/cli releases set-commits "$APP_VERSION" --auto
npx @sentry/cli releases finalize "$APP_VERSION"
```

## Checklist avant ouverture publique

- [ ] DNS propagés (renocalcpro.fr + www)
- [ ] Certificat Let's Encrypt obtenu (vérif : `curl -I https://renocalcpro.fr`)
- [ ] Score A+ sur [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- [ ] Score A+ sur [securityheaders.com](https://securityheaders.com)
- [ ] Login fonctionne (magic link reçu, redirection OK)
- [ ] Upload photo → ClamAV scan → présent dans S3 OVH
- [ ] Paiement Stripe test (mode test puis live) → webhook reçu et traité
- [ ] Email transactionnel reçu (magic link, reset password, invitation team)
- [ ] Sentry capture une erreur test (déclencher manuellement via /api/test/error)
- [ ] Backup nocturne tourne (vérifier `/var/log/renocal-backup.log` le lendemain)
- [ ] Uptime monitoring vert depuis 24 h consécutives
- [ ] Documentation mise à jour : RUNBOOK.md à jour avec IP, contacts, procédures

## Coûts mensuels estimés

| Service | Plan | Coût |
| --- | --- | --- |
| OVH VPS Comfort 4 vCPU / 8 Go | mensuel | ~15 € |
| OVH Postgres Essential 2 GB | mensuel | ~10 € |
| OVH Object Storage | usage (~50 Go) | ~2 € |
| Domaine renocalcpro.fr | annuel | ~10 € / an |
| Stripe | 1.4 % + 0.25 € par transaction EU | usage |
| Anthropic Claude | input/output tokens | ~50-200 € selon usage |
| Sentry Developer | gratuit jusqu'à 5 k events/mois | 0 € |
| Postmark / Resend | gratuit puis ~9 € / 10 k mails | 0-9 € |
| UptimeRobot | gratuit jusqu'à 50 monitors | 0 € |
| **Total fixe** | | **~30-40 € / mois** |
| **Total avec usage moyen** | | **~80-250 € / mois** |

## Contacts utiles en cas d'incident

| Service | URL / contact |
| --- | --- |
| OVH support VPS | support.ovh.com (24/7) |
| Stripe support | support.stripe.com |
| Anthropic status | status.anthropic.com |
| Let's Encrypt status | letsencrypt.status.io |

Voir `docs/RUNBOOK.md` pour les procédures d'incident détaillées.
