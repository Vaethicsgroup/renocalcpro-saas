# API REST pública — Réno·Calc Pro v1 (Português)

> 📚 Documentação interativa: https://renocalcpro.fr/pt/api-docs
> 📐 Especificação OpenAPI: https://renocalcpro.fr/api/v1/openapi.json
> 🌍 Outras línguas: [Français](./fr.md) · [English](./en.md) · [Español](./es.md) · [Deutsch](./de.md)

## Início rápido em 5 minutos

### 1. Obter uma chave API
Dashboard → Pro → Definições → API → "Gerar chave"
Anote o segredo exibido **apenas uma vez** (formato `rnc_live_<prefix>.<secret>`).

### 2. Primeira chamada
```bash
curl -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/me
```

### 3. Criar um projeto
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Casa de teste","surfaceM2":95,"buildingType":"maison"}'
```

### 4. Gerar um relatório
```bash
curl -X POST https://renocalcpro.fr/api/v1/projects/PROJECT_ID/reports \
  -H "Authorization: Bearer rnc_live_abc.xxx" \
  -H "Content-Type: application/json" \
  -d '{"template":"AUDIT_PARTICULIER","mode":"complet","locale":"pt"}'
```

### 5. Descarregar o PDF
Polling em `GET /reports/{id}` até `status=ready`, depois:
```bash
curl -L -o audit.pdf -H "Authorization: Bearer rnc_live_abc.xxx" \
  https://renocalcpro.fr/api/v1/reports/REPORT_ID/pdf
```

## Autenticação

Header `Authorization: Bearer <prefix>.<secret>`.

### Scopes

| Scope  | Métodos | Rate-limit |
|--------|---------|------------|
| BASIC  | GET     | 60 req/min |
| FULL   | GET, POST, DELETE | 600 req/min |

## Endpoints (14)

Ver `fr.md` para a tabela completa — os caminhos e scopes são independentes do idioma.

## Suporte

- 📧 contact@renocalcpro.fr
- 📚 [Centro de ajuda](https://renocalcpro.fr/pt/help)
