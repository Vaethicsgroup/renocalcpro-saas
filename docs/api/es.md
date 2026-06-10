# API REST pública — Réno·Calc Pro v1 (Español)

> 📚 Documentación interactiva: https://renocalcpro.fr/es/api-docs
> 📐 Especificación OpenAPI: https://renocalcpro.fr/api/v1/openapi.json
> 🌍 Otros idiomas: [Français](./fr.md) · [English](./en.md) · [Deutsch](./de.md) · [Português](./pt.md)

## Inicio rápido en 5 minutos

### 1. Obtener una clave API
Dashboard → Pro → Configuración → API → "Generar clave"
Anote el secreto mostrado **una sola vez** (formato `rnc_live_<prefix>.<secret>`).

### 2. Primera llamada
```bash
curl -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/me
```

### 3. Crear un proyecto
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Casa de prueba","surfaceM2":95,"buildingType":"maison"}'
```

### 4. Generar un informe
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/PROJECT_ID/reports \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"template":"AUDIT_PARTICULIER","mode":"complet","locale":"es"}'
```

### 5. Descargar el PDF
Polling en `GET /reports/{id}` hasta `status=ready`, luego:
```bash
curl -L -o audit.pdf -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/reports/REPORT_ID/pdf
```

## Autenticación

Header `Authorization: Bearer <prefix>.<secret>`.

### Scopes

| Scope  | Métodos | Rate-limit |
|--------|---------|------------|
| BASIC  | GET     | 60 req/min |
| FULL   | GET, POST, DELETE | 600 req/min |

## Endpoints (14)

Ver `fr.md` para la tabla completa — las rutas y scopes son independientes del idioma.

## Soporte

- 📧 contact@renocalcpro.fr
- 📚 [Centro de ayuda](https://renocalcpro.fr/es/help)
