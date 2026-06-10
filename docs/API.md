# API REST publique — Réno·Calc Pro v1

Documentation interactive : https://renocalcpro.fr/fr/api-docs
Spec OpenAPI brute : https://renocalcpro.fr/api/v1/openapi.json

## Authentification

Header `Authorization: Bearer <prefix>.<secret>` (format `rnc_live_a1b2c3d4.xxxxxxxx`).

La clé est créée depuis votre dashboard `/o/settings/api-keys` (plans Enterprise uniquement, feature flag `REST_API`).
Le secret n'est affiché **qu'une seule fois** à la création — stockez-le dans un coffre-fort (1Password, Vault).

### Scopes

| Scope  | Méthodes autorisées | Rate-limit         |
|--------|---------------------|--------------------|
| BASIC  | GET                 | 60 req / min       |
| FULL   | GET, POST           | 600 req / min      |

## Endpoints

| Méthode | Chemin                              | Description                                  | Scope min |
|---------|-------------------------------------|----------------------------------------------|-----------|
| GET     | `/api/v1/me`                        | Contexte clé API + plan + quotas             | BASIC     |
| GET     | `/api/v1/projects`                  | Liste paginée des dossiers                   | BASIC     |
| POST    | `/api/v1/projects`                  | Créer un nouveau dossier                     | FULL      |
| GET     | `/api/v1/projects/{id}`             | Détail d'un dossier                          | BASIC     |
| POST    | `/api/v1/projects/{id}/reports`     | Générer un rapport (asynchrone, retourne 202)| FULL      |
| GET     | `/api/v1/reports/{id}`              | Statut + métadonnées d'un rapport            | BASIC     |
| GET     | `/api/v1/reports/{id}/pdf`          | Téléchargement binaire du PDF                | BASIC     |
| GET     | `/api/v1/openapi.json`              | Spec OpenAPI 3.1                             | (public)  |

## Exemples

### Créer un dossier

```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_a1b2c3d4.xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maison Dupont",
    "clientName": "Jean Dupont",
    "address": "12 rue de la Paix, 75002 Paris",
    "surfaceM2": 95,
    "buildingType": "maison",
    "constructionYear": 1978
  }'
```

Réponse `201 Created` :

```json
{
  "id": "clx7y3z9k0001abc",
  "name": "Maison Dupont",
  "surfaceM2": 95,
  "status": "draft",
  "createdAt": "2026-05-09T10:23:45.000Z"
}
```

### Générer un rapport

```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/clx7y3z9k0001abc/reports \
  -H "Authorization: Bearer rnc_live_a1b2c3d4.xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{ "template": "AUDIT_PARTICULIER", "mode": "complet", "locale": "fr" }'
```

Retourne `202 Accepted` — interrogez ensuite `/api/v1/reports/{id}` pour suivre le statut (`pending` → `generating` → `ready`).

### Télécharger le PDF

```bash
curl -L -o audit.pdf \
  -H "Authorization: Bearer rnc_live_a1b2c3d4.xxxxxxxx" \
  https://renocalcpro.fr/api/v1/reports/clx7y3z9k0002def/pdf
```

## Codes d'erreur

| Status | error                          | Cause                                                          |
|--------|--------------------------------|----------------------------------------------------------------|
| 400    | `invalid_json_body`            | Body JSON malformé                                             |
| 400    | `field_required`               | Champ obligatoire manquant                                     |
| 400    | `invalid_template`             | Template inconnu                                               |
| 401    | `missing_or_malformed_bearer_token` | Header `Authorization` absent ou malformé                |
| 401    | `invalid_api_key`              | Préfixe inconnu ou secret incorrect                            |
| 401    | `key_revoked` / `key_expired`  | Clé désactivée                                                 |
| 402    | `rest_api_not_enabled_for_plan`| Plan ne dispose pas de la feature `REST_API` (≥ Enterprise)   |
| 402    | `quota_reached`                | Quota du plan atteint pour la feature demandée                |
| 403    | `scope_insufficient`           | Clé BASIC sur endpoint FULL                                    |
| 404    | `project_not_found` / `report_not_found` | Ressource inexistante ou hors organisation         |
| 429    | `rate_limit_exceeded`          | Voir header `Retry-After`                                      |

## Versioning

L'URL inclut la version (`/v1`). Les changements breaking créent `/v2`. Les versions sont supportées 12 mois.

## Sécurité

- TLS 1.3 uniquement (HSTS preload)
- Rate-limit Redis (Upstash) par préfixe + IP
- Hash bcrypt des secrets (jamais stockés en clair)
- Audit log de tous les appels (table `AuditLog`, conservé 90 j)
- CORS désactivé par défaut — ajout d'`allowedOrigins` lors de la création de la clé
