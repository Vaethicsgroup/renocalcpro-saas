# Public REST API — Réno·Calc Pro v1 (English)

> 📚 Interactive documentation: https://renocalcpro.fr/en/api-docs
> 📐 OpenAPI spec: https://renocalcpro.fr/api/v1/openapi.json
> 🌍 Other languages: [Français](./fr.md) · [Español](./es.md) · [Deutsch](./de.md) · [Português](./pt.md)

## 5-minute quickstart

### 1. Get an API key
Dashboard → Pro → Settings → API → "Generate key"
Note the secret displayed **only once** (format `rnc_live_<prefix>.<secret>`).

### 2. First call
```bash
curl -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/me
```

### 3. Create a project
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test house","surfaceM2":95,"buildingType":"maison"}'
```

### 4. Generate a report
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/PROJECT_ID/reports \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"template":"AUDIT_PARTICULIER","mode":"complet","locale":"en"}'
```

### 5. Download the PDF
Poll `GET /reports/{id}` until `status=ready`, then:
```bash
curl -L -o audit.pdf -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/reports/REPORT_ID/pdf
```

## Authentication

Header `Authorization: Bearer <prefix>.<secret>`.

### Scopes

| Scope  | Methods | Rate-limit |
|--------|---------|------------|
| BASIC  | GET     | 60 req/min |
| FULL   | GET, POST, DELETE | 600 req/min |

## Endpoints (14)

See `fr.md` for the complete table — endpoint paths and method scopes are language-independent.

## Webhooks

14 events emitted by Réno·Calc Pro, HMAC-SHA256 signature, 6-step exponential retry.
Reference receivers: `examples/webhook-receivers/` (Express, Cloudflare Workers, Python Flask, Zapier guide).

## Support

- 📧 contact@renocalcpro.fr
- 📚 [Help center](https://renocalcpro.fr/en/help)
