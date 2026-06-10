# Load testing — k6

Procédure de stress-test pour valider la capacité de l'infrastructure avant déploiement prod.

## Pré-requis

```bash
# Installer k6 (Mac)
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Tests disponibles

| Test | Cible | Métrique critique |
|------|-------|-------------------|
| `auth-flow.k6.js` | Parcours signup → dashboard, 100 VUs / 5 min | p95 < 800 ms, < 1 % erreurs |
| `pdf-generation.k6.js` | Génération PDF Audit complet, 50 VUs / 3 min | p95 < 8 s, 0 % erreurs |
| `api-v1.k6.js` | Hammer API v1 GET, 200 → 500 req/s | Rate-limit kick à 60 req/min/key |

## Lancement

```bash
# Préparer le résultats dir
mkdir -p tests/load/results

# Auth flow contre staging
k6 run --env BASE_URL=https://staging.renocalcpro.fr tests/load/auth-flow.k6.js

# PDF generation (nécessite une API key valide)
k6 run --env BASE_URL=https://staging.renocalcpro.fr \
       --env API_TOKEN=rnc_test_xxx.yyy \
       tests/load/pdf-generation.k6.js

# API v1 rate-limit
k6 run --env BASE_URL=https://staging.renocalcpro.fr \
       --env API_TOKENS=rnc_test_a.x,rnc_test_b.y,rnc_test_c.z \
       tests/load/api-v1.k6.js
```

## Output Grafana k6 Cloud (optionnel)

```bash
k6 cloud login
k6 cloud tests/load/auth-flow.k6.js
# → URL dashboard temps réel + alerting + comparaison historique
```

## Interprétation

### auth-flow

✅ **Bon résultat** :
- Signup p95 < 1500 ms (inclut envoi mail mock)
- Dashboard p95 < 600 ms
- Error rate < 1 %
- Aucun timeout 30s

⚠ **Signal d'alarme** :
- Latence dashboard > 1 s → check pool DB connections, query N+1
- Erreurs > 5 % → backend saturé, scale up workers
- Magic-link timeout → Resend API saturée

### pdf-generation

✅ **Bon résultat** :
- Génération p95 < 8 s
- Taille PDF moyenne 250-500 Ko (avec photos)

⚠ **Signal d'alarme** :
- Génération > 15 s → scale up worker @react-pdf, vérifier pool fonts
- Mémoire pod > 1 Go → potentiel memory leak React-PDF

### api-v1

✅ **Bon résultat** :
- Rate-limited count > 100 (rate-limit fonctionne)
- 200 OK p95 < 500 ms
- 429 p95 < 200 ms (refus rapide)

⚠ **Signal d'alarme** :
- Aucun 429 → rate-limit MAL configuré, vérifier Redis Upstash
- 200 p95 > 1 s → DB lente sur GET /me/overrides

---

## Capacity planning

Données empiriques observées sur staging OVH (config Sprint 21) :

| VPS | CPU | RAM | Capacité estimée |
|-----|-----|-----|------------------|
| OVH B2-7 | 2 vCPU | 7 Go | ~50 dossiers/jour, ~5 PDF/min |
| OVH B2-15 | 4 vCPU | 15 Go | ~200 dossiers/jour, ~15 PDF/min |
| OVH B2-30 | 8 vCPU | 30 Go | ~1 000 dossiers/jour, ~40 PDF/min |
| OVH B2-60 + Redis dédié | 16 vCPU | 60 Go | ~5 000 dossiers/jour, ~100 PDF/min |

Pour > 5 000 dossiers/jour : passer à un cluster Kubernetes (HA) avec 3 pods web + 2 workers PDF dédiés + Postgres managé OVH.

---

## CI / nightly

Pour automatiser les load tests en nightly :

```yaml
# .github/workflows/load-nightly.yml
name: Load tests (nightly)
on:
  schedule:
    - cron: "0 2 * * *"  # 2h UTC
jobs:
  load:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run --quiet tests/load/auth-flow.k6.js
        env:
          BASE_URL: https://staging.renocalcpro.fr
      - run: k6 run --quiet tests/load/api-v1.k6.js
        env:
          BASE_URL: https://staging.renocalcpro.fr
          API_TOKENS: ${{ secrets.E2E_API_TOKENS }}
      - uses: actions/upload-artifact@v4
        with:
          name: load-results-${{ github.run_id }}
          path: tests/load/results/
```

Déclencher une alerte Slack si threshold dépassé via la sortie JSON parseable.
