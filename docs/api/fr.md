# API REST publique — Réno·Calc Pro v1 (Français)

> 📚 Documentation interactive : https://renocalcpro.fr/fr/api-docs
> 📐 Spec OpenAPI brute : https://renocalcpro.fr/api/v1/openapi.json
> 🌍 Autres langues : [English](./en.md) · [Español](./es.md) · [Deutsch](./de.md) · [Português](./pt.md)

## Quickstart en 5 minutes

### 1. Obtenir une clé API
Dashboard → Pro → Paramètres → API → « Générer une clé »
Notez le secret affiché **une seule fois** (format `rnc_live_<prefix>.<secret>`).

### 2. Premier appel
```bash
curl -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/me
```

### 3. Créer un dossier
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Maison test","surfaceM2":95,"buildingType":"maison"}'
```

### 4. Générer un rapport
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/PROJECT_ID/reports \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"template":"AUDIT_PARTICULIER","mode":"complet","locale":"fr"}'
```

### 5. Récupérer le PDF
Polling sur `GET /reports/{id}` jusqu'à `status=ready`, puis :
```bash
curl -L -o audit.pdf -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/reports/REPORT_ID/pdf
```

## Endpoints (14)

| Méthode | Chemin | Scope min |
|---------|--------|-----------|
| GET | `/api/v1/me` | BASIC |
| GET | `/api/v1/me/overrides` | BASIC |
| GET | `/api/v1/projects` | BASIC |
| POST | `/api/v1/projects` | FULL |
| GET | `/api/v1/projects/{id}` | BASIC |
| POST | `/api/v1/projects/{id}/reports` | FULL |
| POST | `/api/v1/projects/{id}/identify-material` | FULL |
| GET | `/api/v1/projects/{id}/materials` | BASIC |
| POST | `/api/v1/projects/{id}/materials` | FULL |
| DELETE | `/api/v1/projects/{id}/materials/{selectionId}` | FULL |
| GET | `/api/v1/reports/{id}` | BASIC |
| GET | `/api/v1/reports/{id}/pdf` | BASIC |
| GET | `/api/v1/openapi.json` | public |
| GET | `/api/v1/schemas/material-patch.json` | public |
| GET | `/api/v1/schemas/system-patch.json` | public |

Détails complets : [API.md](../API.md) · [WEBHOOKS.md](../WEBHOOKS.md)

## Support

- 📧 contact@renocalcpro.fr
- 📚 [Centre d'aide](https://renocalcpro.fr/fr/help)
