# Öffentliche REST API — Réno·Calc Pro v1 (Deutsch)

> 📚 Interaktive Dokumentation: https://renocalcpro.fr/de/api-docs
> 📐 OpenAPI-Spezifikation: https://renocalcpro.fr/api/v1/openapi.json
> 🌍 Andere Sprachen: [Français](./fr.md) · [English](./en.md) · [Español](./es.md) · [Português](./pt.md)

## Schnellstart in 5 Minuten

### 1. API-Schlüssel erhalten
Dashboard → Pro → Einstellungen → API → "Schlüssel generieren"
Notieren Sie das **nur einmal** angezeigte Geheimnis (Format `rnc_live_<prefix>.<secret>`).

### 2. Erster Aufruf
```bash
curl -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/me
```

### 3. Projekt erstellen
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Testhaus","surfaceM2":95,"buildingType":"maison"}'
```

### 4. Bericht generieren
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/PROJECT_ID/reports \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"template":"AUDIT_PARTICULIER","mode":"complet","locale":"de"}'
```

### 5. PDF herunterladen
Polling auf `GET /reports/{id}` bis `status=ready`, dann:
```bash
curl -L -o audit.pdf -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/reports/REPORT_ID/pdf
```

## Authentifizierung

Header `Authorization: Bearer <prefix>.<secret>`.

### Scopes

| Scope  | Methoden | Rate-Limit |
|--------|----------|------------|
| BASIC  | GET      | 60 Anfragen/Min |
| FULL   | GET, POST, DELETE | 600 Anfragen/Min |

## Endpunkte (14)

Siehe `fr.md` für die vollständige Tabelle — Pfade und Scopes sind sprachunabhängig.

## Support

- 📧 contact@renocalcpro.fr
- 📚 [Hilfecenter](https://renocalcpro.fr/de/help)
