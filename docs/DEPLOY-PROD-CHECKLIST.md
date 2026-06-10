# Checklist déploiement production OVH — 0-downtime + rollback

Document opérationnel pour le déploiement Réno·Calc Pro SaaS en production sur l'infrastructure OVH (Roubaix + DR Strasbourg).

**Cible RTO** : 5 min · **Cible RPO** : 1 min · **Stratégie** : Blue/Green avec migrations Prisma idempotentes et réversibles.

## v2.3 — Updates Sprint Polish final

### Nouveau : script dry-run

`./scripts/deploy-dry-run.sh` simule deploy.sh sans exécuter. À lancer **avant tout déploiement** pour valider :
- Présence `.env.production` + `docker-compose.prod.yml`
- Liste migrations Prisma à appliquer
- Plan complet en 8 étapes (build → migrations → backup → health-check → bascule → health-check post → cleanup)

```bash
cd saas && ./scripts/deploy-dry-run.sh
```

### Lighthouse cible v2.3

10 URLs auditées en CI (cf. `lighthouserc.json` + `docs/LIGHTHOUSE-RESULTS.md`) :
- Perf ≥ 90 · A11y ≥ 95 · BP ≥ 95 · SEO ≥ 90
- LCP < 2.5s · CLS < 0.10 · TBT < 300ms

### Tests Playwright v2.3

`e2e/v2-redesign.spec.ts` couvre :
- Parcours INDIVIDUAL / PRO / ADMIN (auth fixture `e2e/fixtures/auth.ts` via endpoint `/api/test/seed-session`)
- 3 viewports : 360 / 768 / 1440
- 5 langues : FR / EN / ES / DE / PT
- Tag `@v2-redesign` pour exécution ciblée

### Fonts critiques préchargées

4 fonts préload `<head>` confirmées :
- `Inter-Regular.woff2` + `Inter-SemiBold.woff2`
- `SourceSerif4-Regular.woff2` + `SourceSerif4-Bold.woff2`

Self-hosted RGPD + `font-display: swap` + `unicode-range` latin+latin-ext.

### Composants legacy stub-isés

`Hero.tsx`, `PublicHeader.tsx`, `PublicFooter.tsx` deviennent des re-exports deprecated vers les versions Premium (suppression définitive Sprint v2.4).

---

## Checklist originale (à jour)


---

## Pré-déploiement (J-1)

### 1. Code freeze + revue
- [ ] Tag git `release/vX.Y.Z` créé sur `main`
- [ ] CHANGELOG `saas/CHANGELOG.md` à jour avec breaking changes signalés
- [ ] CHANGELOG `packages/core/CHANGELOG.md` à jour si bump version
- [ ] Pull-request release reviewée par 2 mainteneurs
- [ ] CI verte sur tag : i18n strict + tests Vitest + Playwright + Lighthouse
- [ ] Bundle analyzer : aucune régression > 10 % sur taille initiale
- [ ] Audit sécurité : `pnpm audit:deps` sans HIGH/CRITICAL non-corrigés
- [ ] Audit secrets : `pnpm audit:secrets` (gitleaks) clean

### 2. Validation des migrations Prisma
- [ ] Lister les migrations à appliquer : `ls saas/prisma/migrations/ | grep -v applied`
- [ ] Pour CHAQUE migration nouvelle :
  - [ ] **Réversible** : un script `down.sql` documenté (manuel — Prisma n'a pas de down auto)
  - [ ] **Idempotente** : `IF NOT EXISTS` sur ALTER TYPE, CREATE INDEX, etc.
  - [ ] **Non bloquante** : pas d'`ALTER TABLE ... ADD COLUMN NOT NULL` sans default, pas de DROP COLUMN sans warning client
  - [ ] **Backfill** : si nouveau champ NOT NULL, prévoir un script de backfill exécuté AVANT activation du code consommateur
- [ ] Test sur copie staging du dump prod la veille
- [ ] Mesure du temps d'application (warning si > 60 s sur table > 10 M rows)

### 3. Backup
- [ ] Backup BDD prod via `bash deploy/scripts/backup-pgdump.sh` → S3 OVH
- [ ] Vérification taille + checksum SHA-256 du dump
- [ ] Test de restauration sur instance temporaire (vérifie que le backup est utilisable)
- [ ] Backup S3 storage : list-objects-v2 récent
- [ ] Snapshot disque OVH (Console → Hot snapshot)

---

## J-Day : déploiement Blue/Green

### Étape 1 — Préparation environnement Green (5 min)
```bash
# Sur l'host de prod
cd /opt/renocalcpro
./deploy/scripts/deploy.sh --target=green --tag=vX.Y.Z --skip-migration
```
- [ ] Container Green pull image `:vX.Y.Z`
- [ ] Variables d'env Green sourcées depuis `.env.prod` (HashiCorp Vault)
- [ ] Container Green up (port 8081), Blue toujours actif sur 8080
- [ ] Smoke test interne Green : `curl http://localhost:8081/api/health` → 200
- [ ] Logs Green : `docker logs renocal-saas-green --tail 100` — pas d'erreur fatale

### Étape 2 — Migration Prisma sur Green (variable, 30s à 5min)
```bash
docker exec renocal-saas-green pnpm db:migrate deploy
```
- [ ] Output : `X migration(s) applied`
- [ ] Vérification post-migration :
  ```bash
  docker exec renocal-saas-green pnpm prisma migrate status
  ```
- [ ] Smoke test Prisma : `docker exec renocal-saas-green node -e "require('./node_modules/@prisma/client').PrismaClient && console.log('OK')"`

### Étape 3 — Smoke tests fonctionnels Green (3 min)
- [ ] `curl https://staging-internal.renocalcpro.fr/api/health` → `{ ok: true }`
- [ ] `curl https://staging-internal.renocalcpro.fr/api/v1/openapi.json` → JSON valide
- [ ] Login magic-link manuel sur staging
- [ ] Navigation : `/p/dashboard` rendu OK
- [ ] PDF génération : forcer un report sur un projet test → vérifier taille > 200 Ko
- [ ] Webhook test : POST manuel → vérifier livraison via dashboard `/admin/webhook-deliveries`

### Étape 4 — Bascule Caddy reverse-proxy (30 s)
```bash
# Modifier /etc/caddy/Caddyfile :
# upstream renocal { server localhost:8081 }  # était 8080
sudo systemctl reload caddy
```
- [ ] Test depuis l'extérieur : `curl https://renocalcpro.fr/api/health` → 200
- [ ] Vérifier headers : `X-Served-By: green-vX.Y.Z`
- [ ] Plausible analytics : pas de chute brutale du trafic
- [ ] Sentry : pas de spike d'erreurs (5 min de surveillance)

### Étape 5 — Cooldown Blue (15 min surveillance)
- [ ] Blue toujours up mais sans trafic (peut servir de rollback instantané)
- [ ] Surveillance dashboards Grafana :
  - HTTP 5xx rate < 0.1 %
  - DB query p99 < 500 ms
  - Memory Green < 80 %
  - CPU Green < 60 %
- [ ] Vérification webhooks broadcast catalogue : aucun event perdu
- [ ] Si tout vert pendant 15 min → arrêt Blue : `docker stop renocal-saas-blue`

---

## Rollback (< 5 min RTO)

### Cas 1 : problème détecté < 15 min après bascule
```bash
# 1. Bascule Caddy retour Blue
sudo sed -i 's/localhost:8081/localhost:8080/' /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 2. Vérif retour à la normale
curl https://renocalcpro.fr/api/health
```
- [ ] Migrations Prisma : si nouvelle migration appliquée, **vérifier compatibilité ascendante** (le code Blue doit pouvoir lire les nouvelles colonnes — c'est pourquoi on évite les colonnes NOT NULL sans default)
- [ ] Si migration incompatible → rollback BDD via `pg_restore` du backup pré-déploiement
  - **⚠ Seulement si aucun nouveau dossier client n'a été créé entre la bascule et le rollback** (sinon perte de données)
  - Si données perdues acceptable → exécuter `bash deploy/scripts/rollback-bdd.sh --backup=YYYY-MM-DD-HH-MM`

### Cas 2 : problème détecté > 15 min après bascule (Blue stoppé)
- [ ] Restart Blue : `docker start renocal-saas-blue`
- [ ] Wait health check : `curl http://localhost:8080/api/health`
- [ ] Bascule Caddy → Blue
- [ ] Pour les migrations BDD irréversibles : créer un patch hotfix dédié plutôt que rollback

---

## Post-déploiement (J+1)

### Validation
- [ ] Lighthouse CI run nightly contre prod : scores ≥ targets
- [ ] Sentry : aucune nouvelle catégorie d'erreur
- [ ] Plausible : trafic et conversion stables
- [ ] Webhooks dashboard : taux de livraison > 95 %
- [ ] Email Resend : taux de bounce < 2 %

### Communication
- [ ] Annonce changelog interne dans #releases (Slack/Discord)
- [ ] Page publique `/changelog` mise à jour avec les nouveautés visibles utilisateur
- [ ] Newsletter clients si features majeures
- [ ] Status page `/status` notation incident "Maintenance — déploiement vX.Y.Z" résolue

### Cleanup
- [ ] Supprimer le tag `release/vX.Y.Z-rc` si utilisé
- [ ] Container Blue : `docker rm renocal-saas-blue` si tout stable depuis 7 j
- [ ] Anciennes images : `docker image prune --filter "until=720h"`
- [ ] Rotation backup S3 : conserver hebdo + mensuel + annuel

---

## Migrations BDD — recettes éprouvées

### Ajouter une colonne nullable (safe)
```sql
ALTER TABLE "Project" ADD COLUMN "newField" TEXT;
```

### Ajouter une colonne NOT NULL (2 phases)
**Phase 1** (release N) :
```sql
ALTER TABLE "Project" ADD COLUMN "newField" TEXT;
-- Backfill via job ou script
UPDATE "Project" SET "newField" = 'default' WHERE "newField" IS NULL;
```
**Phase 2** (release N+1, après que tous les writers utilisent newField) :
```sql
ALTER TABLE "Project" ALTER COLUMN "newField" SET NOT NULL;
```

### Ajouter un enum value (safe)
```sql
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'NEW_EVENT';
```

### Renommer une colonne (3 phases — éviter si possible)
**Phase 1** : ajouter nouvelle colonne, double-write applicatif
**Phase 2** : backfill historique
**Phase 3** : cleanup ancienne colonne

### Ajouter un index sur grosse table (concurrent)
```sql
CREATE INDEX CONCURRENTLY "Project_createdAt_idx" ON "Project"("createdAt");
```
**Note** : `CONCURRENTLY` ne fonctionne pas dans une transaction Prisma migration — utiliser script SQL standalone.

---

## Monitoring & alertes

### Dashboards critiques (Grafana)
- 🚦 HTTP 5xx rate (par endpoint)
- 🚦 DB query p50/p95/p99 latency
- 🚦 PDF generation queue depth
- 🚦 Webhook delivery success rate
- 🚦 Stripe webhook signature failures
- 🚦 Auth failure rate (anti-bruteforce)

### Alertes Alertmanager (PagerDuty)
- 🚨 5xx rate > 1 % pendant 2 min → P1
- 🚨 Health check fail 3 consécutifs → P1
- 🚨 DB connection pool exhausted → P1
- 🚨 Disk usage > 85 % → P2
- 🚨 Webhook delivery failure rate > 20 % → P2

---

## Contacts d'urgence

- **DevOps lead** : Flora Vincia (flora@renocalcpro.fr)
- **OVH support** : compte `vinciaflora`, ticket via console
- **Stripe** : dashboard.stripe.com → Support
- **Sentry** : sentry.io/organizations/renocalcpro
- **Anthropic** : console.anthropic.com → Support
