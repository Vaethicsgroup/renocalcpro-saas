# RUNBOOK — Réno·Calc Pro Production

Document opérationnel pour la gestion d'incidents en production. À lire AVANT d'agir.

> **Règle d'or** : 1) Communiquer 2) Stabiliser 3) Diagnostiquer 4) Résoudre 5) Post-mortem

---

## Niveaux de sévérité

| Niveau | Définition | Réponse | SLA |
|--------|------------|---------|-----|
| **P0** | Service totalement inaccessible OU perte de données | All-hands · réveil OK | 15 min |
| **P1** | Fonctionnalité critique cassée pour > 50 % des users | On-call · 1 ingénieur | 30 min |
| **P2** | Fonctionnalité non-critique cassée OU dégradation perf | Heures ouvrables | 4 h |
| **P3** | Bug cosmétique ou edge case | Backlog priorisé | 1 semaine |

---

## Contacts et escalade

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| DevOps lead | Flora Vincia (flora@renocalcpro.fr) | 24/7 P0/P1 |
| OVH support | Console OVH → ticket | 24/7 P0 hardware |
| Stripe support | dashboard.stripe.com | 24/5 |
| Anthropic support | console.anthropic.com | Heures US |
| Sentry on-call | sentry.io alerts | Auto-page |

**Astreinte** : un membre du dev team est on-call par tranches d'1 semaine. Rotation publiée dans `docs/ON-CALL-SCHEDULE.md`.

---

## Scénarios d'incident

### 1. PostgreSQL down ou inaccessible

**Symptômes** : 5xx massifs, `/api/health` → 503, dashboard health affiche DB en rouge

**Diagnostic immédiat** :
```bash
# 1. Health check
curl https://renocalcpro.fr/api/health

# 2. Vérif connexion depuis Pod
kubectl exec -it deploy/renocal-saas -- nc -zv postgres-prod 5432

# 3. Console OVH Postgres : status, CPU, disk usage, connections
```

**Causes fréquentes** :
- Connection pool saturé → `pg_stat_activity` → kill long-running queries
- Disk plein → ALERT Alertmanager déjà tirée → contact OVH support
- Master crashé → failover automatique vers replica (RTO 30s)

**Procédure résolution** :
1. **Communiquer** : status page → ouvrir incident (`severity: MAJOR`, `state: INVESTIGATING`)
2. **Stabiliser** : si pool saturé, restart pods (`kubectl rollout restart deploy/renocal-saas`)
3. **Diagnostiquer** : Grafana dashboard PostgreSQL > Slow Queries
4. **Résoudre** : selon cause (kill query / scale up / failover)
5. **Vérifier** : health check vert + Sentry calme + écriture test
6. **Communiquer** : status update `RESOLVED` + post-mortem dans 48h

**Rollback BDD si migration récente cause** : `bash deploy/scripts/rollback-bdd.sh --backup=YYYY-MM-DD-HH-MM`

---

### 2. Redis (Upstash) down

**Symptômes** : rate-limiting ne fonctionne plus, sessions perdues, lent

**Diagnostic** :
```bash
curl -I https://your-redis-url.upstash.io
```

**Procédure** :
1. **Stabiliser** : code fonctionne en mode dégradé (rate-limit désactivé) — pas de panique
2. **Communiquer** : status `DEGRADED` (pas MAJOR)
3. **Vérifier** : Upstash console + Twitter @upstash
4. **Failover** : créer nouvelle DB Upstash région secondaire, MAJ env `REDIS_URL`, restart pods
5. **Post-incident** : envisager Redis self-hosted secondaire

---

### 3. Stripe webhook signature failures

**Symptômes** : Stripe dashboard → Webhooks → endpoints rouges, paiements non synchronisés

**Diagnostic** :
```
- Vérifier STRIPE_WEBHOOK_SECRET correspond
- Vérifier route /api/webhooks/stripe répond 200
- Check Sentry pour "stripe-webhook"
```

**Causes** :
- Rotation secret Stripe sans MAJ env var
- Body parsing modifié (Stripe envoie raw body)
- Timeout (> 30s)

**Procédure** :
1. Vérifier dernier déploiement (rollback si récent)
2. Re-générer secret Stripe → MAJ env → restart
3. Re-jouer events manqués depuis dashboard Stripe (max 30 jours)
4. **JAMAIS** modifier les paiements à la main en BDD — toujours via Stripe

---

### 4. PDF generation stuck / slow

**Symptômes** : status `pending` qui reste, queue grandit, alerte Grafana

**Diagnostic** :
```bash
# Compter PDFs en attente
psql > SELECT count(*) FROM "Report" WHERE status = 'pending';

# Voir les workers React-PDF (logs)
kubectl logs -l app=renocal-pdf-worker --tail=100
```

**Causes** :
- Memory leak React-PDF → pod OOMKilled → restart automatique
- Polices manquantes → erreur silencieuse → vérifier `public/fonts/`
- S3 upload échoue → vérifier credentials S3 + bucket exists

**Procédure** :
1. **Stabiliser** : `kubectl rollout restart deploy/renocal-pdf-worker`
2. **Re-tenter** : tous les `pending > 10 min` → `UPDATE Report SET status='pending', attemptCount=0`
3. **Surveillance** : Grafana → PDF queue depth doit redescendre

---

### 5. AI Anthropic down ou rate-limited

**Symptômes** : `identifyMaterial`, `agentsOrchestrator` retournent erreurs 429/503

**Procédure** :
1. **Mode dégradé automatique** : sans `ANTHROPIC_API_KEY`, le code utilise mock — déjà testé
2. **Désactiver flag** `AI_AGENT_ORCHESTRATOR_AUTO` via `/admin/feature-flags` (rollout 0%)
3. **Communiquer** : status `Maintenance IA` (pas un incident — les calculs principaux marchent)
4. **Vérifier statut** : status.anthropic.com
5. **Reprendre** dès le rétablissement

---

### 6. Webhook deliveries en retard / queue grandit

**Symptômes** : `/admin/webhook-deliveries` montre > 200 PENDING, alerte Grafana

**Diagnostic** :
```sql
SELECT status, count(*) FROM "WebhookDelivery"
WHERE "createdAt" > now() - interval '1 hour' GROUP BY status;
```

**Causes** :
- Cron worker n'a pas tourné depuis > 5 min → vérifier `crontab -l`
- Multiple webhooks vers une URL morte → 30 échecs → auto-disable
- Trop de broadcasts CATALOG_OVERRIDE → throttle

**Procédure** :
1. Lancer manuellement le cron : `curl -H "x-cron-secret: $CRON_SECRET" /api/cron/deliver-webhooks`
2. Vérifier les webhooks auto-disabled : `SELECT * FROM "Webhook" WHERE "disabledAt" > now() - '24h'`
3. Notifier les orgs concernées via dashboard / email

---

### 7. Email (Resend) down

**Symptômes** : magic-links non reçus, Resend dashboard → erreurs

**Procédure** :
1. **Stabiliser** : passer en mode mock temporaire via env `RESEND_API_KEY=""` (les emails sont logués mais pas envoyés)
2. **Communiquer** : bandeau "Magic-link indisponible" sur `/login`
3. **Failover** : configurer Mailjet ou Postmark en backup (TODO)
4. **Reprendre** : restaurer key + replay magic-links demandés pendant l'incident

---

### 8. Cron jobs ne tournent plus

**Symptômes** : webhooks pas livrés, status checks vieillissent, alerte Grafana

**Diagnostic** :
```bash
# Vérifier la dernière exec
psql > SELECT * FROM "HealthCheck" ORDER BY "checkedAt" DESC LIMIT 1;
# Si > 5 min → cron mort
```

**Procédure** :
1. SSH sur host : `crontab -l` → vérifier syntaxe
2. Logs : `tail -f /var/log/cron`
3. Lancer manuellement les 3 crons critiques :
   ```bash
   curl -H "x-cron-secret: $CRON_SECRET" https://renocalcpro.fr/api/cron/deliver-webhooks
   curl -H "x-cron-secret: $CRON_SECRET" https://renocalcpro.fr/api/cron/notify-incident
   curl -H "x-cron-secret: $CRON_SECRET" https://renocalcpro.fr/api/cron/health-check
   ```
4. Si systemd-timer : `systemctl status renocal-cron@*.service`

---

## Template de post-mortem

À rédiger dans les 48h suivant la résolution d'un incident P0/P1.

```markdown
# Post-mortem : <Titre court>

**Date** : YYYY-MM-DD HH:MM UTC
**Sévérité** : P0/P1
**Durée** : XX minutes
**Auteur** : Prénom

## TL;DR
1-2 phrases sur ce qui s'est passé et l'impact.

## Timeline (UTC)
- HH:MM — Symptôme détecté par <source>
- HH:MM — On-call alerté
- HH:MM — Diagnostic posé : <cause>
- HH:MM — Mitigation appliquée
- HH:MM — Service rétabli
- HH:MM — Confirmation par smoke tests

## Cause racine
Description technique précise.

## Impact
- Users impactés : XX (XX % de la base)
- Dossiers impactés : XX
- Pertes de données : OUI / NON
- Pertes financières : XX €

## Ce qui a bien marché
- ...

## Ce qui a moins bien marché
- ...

## Actions correctives
- [ ] **Court terme** (< 1 semaine) : ...
- [ ] **Moyen terme** (< 1 mois) : ...
- [ ] **Long terme** (> 1 mois) : ...

## Détection
Comment aurait-on pu détecter plus tôt ? Ajouter alerte ? Métrique ?
```

---

## Annexes

### Commandes utiles

```bash
# Restart full SaaS
kubectl rollout restart deploy/renocal-saas

# Voir tous les events k8s récents
kubectl get events --sort-by=.metadata.creationTimestamp | tail -50

# DB backup à la volée
bash deploy/scripts/backup-pgdump.sh --target=s3

# Disable maintenance mode
echo "MAINTENANCE_MODE=true" >> .env && kubectl rollout restart deploy/renocal-saas
```

### Monitoring URLs

- Grafana : https://grafana.renocalcpro.fr (admin)
- Sentry : https://sentry.io/organizations/renocalcpro/
- Plausible : https://plausible.renocalcpro.fr
- Status page publique : https://renocalcpro.fr/status
- Dashboard health admin : https://renocalcpro.fr/fr/admin/health
