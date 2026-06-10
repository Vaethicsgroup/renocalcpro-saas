# 🔑 Credentials à fournir avant mise en ligne

> Ne JAMAIS coller ces valeurs dans le chat avec Claude. Mettez-les directement dans `.env.production` côté votre machine, perm 600.

```bash
cd ~/Desktop/RENOCALC\ PRO\ V2/saas
cp .env.example .env.production
chmod 600 .env.production
# édition avec votre éditeur préféré
nano .env.production
```

## Lot A — OVH (priorité 1, bloquant déploiement)

| Variable | Format / source |
|---|---|
| _Type serveur_ | VPS Comfort 4 vCPU / 8 Go RAM / 80 Go SSD recommandé |
| _IP serveur_ | `xxx.xxx.xxx.xxx` après commande |
| _Clé SSH_ | `cat ~/.ssh/id_ed25519.pub` (ou je vous fournis la mienne) |
| `NEXT_PUBLIC_APP_URL` | `https://renocalcpro.fr` |
| `AUTH_URL` | `https://renocalcpro.fr` |

## Lot B — OVH Object Storage (priorité 1)

Espace client OVH → Public Cloud → Object Storage → S3 Users → Add a user.

| Variable | Exemple |
|---|---|
| `S3_ENDPOINT` | `https://s3.gra.io.cloud.ovh.net` (ou région choisie) |
| `S3_REGION` | `gra` / `sbg` / `de` / `uk` |
| `S3_BUCKET` | `renocalcpro-prod-photos` (créer côté OVH) |
| `S3_ACCESS_KEY_ID` | 24 chars |
| `S3_SECRET_ACCESS_KEY` | 40 chars (donné une seule fois — copier dans 1Password) |
| `S3_FORCE_PATH_STYLE` | `true` |

## Lot C — Anthropic Claude (priorité 2)

console.anthropic.com → API Keys → Create Key.

| Variable | Format |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (108 chars) |
| _Limite mensuelle_ | $200/mo recommandé pour démarrer |

## Lot D — Email (priorité 2)

**Au choix.** Resend recommandé (5 min, gratuit jusqu'à 3 000 mails/mois).

### Option Resend (recommandé)
1. resend.com → Sign Up
2. Domains → Add `renocalcpro.fr` (suivre instructions DNS DKIM/SPF/DMARC)
3. API Keys → Create

| Variable | Format |
|---|---|
| `RESEND_API_KEY` | `re_...` |
| `AUTH_EMAIL_FROM` | `auth@renocalcpro.fr` |

### Option SMTP (OVH Pro Mail ou autre)
| Variable | Format |
|---|---|
| `SMTP_HOST` | `ssl0.ovh.net` |
| `SMTP_PORT` | `465` (SSL) ou `587` (TLS) |
| `SMTP_USER` | `auth@renocalcpro.fr` |
| `SMTP_PASS` | mot de passe pro mail |

## Lot E — Stripe (priorité 3, peut attendre Sprint 4)

Dashboard Stripe → Developers → API Keys.

| Variable | Format |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (pour test : `sk_test_...`) |
| `STRIPE_PUBLIC_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (à créer après webhook configuré) |

3 produits à créer : Solo (29 €/mo), Pro (59 €/mo), Team (129 €/mo).

## Secrets à générer côté serveur (une seule fois)

Une fois SSH OVH OK, générez ces secrets sur le serveur :

```bash
echo "AUTH_SECRET=$(openssl rand -base64 64)"
echo "AUDIT_HMAC_KEY=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"
echo "BACKUP_GPG_PASSPHRASE=$(openssl rand -base64 24)"
```

Reportez ces 5 lignes dans `.env.production` sur le serveur.

## Checklist avant déploiement

- [ ] `.env.production` rempli + perm 600 + non commité
- [ ] DNS `renocalcpro.fr` + `www.renocalcpro.fr` pointent vers IP serveur
- [ ] Bucket S3 créé côté OVH
- [ ] Secrets `openssl` générés sur serveur
- [ ] `gitleaks detect` côté local : zero leak
- [ ] Test d'envoi mail Resend OK depuis API
- [ ] Test API Anthropic OK avec un `messages.create` minimal
