# Webhooks Réno·Calc Pro — Référence

Documentation technique de référence pour consommer les webhooks émis par Réno·Calc Pro.

> 📦 **Exemples de receivers prêts à l'emploi** : voir `examples/webhook-receivers/`
> - Node Express : `examples/webhook-receivers/express/`
> - Cloudflare Workers : `examples/webhook-receivers/cloudflare-workers/`
> - Python Flask : `examples/webhook-receivers/python-flask/`
> - Zapier guide : `examples/webhook-receivers/zapier-zap.md`

---

## 1. Format du payload

Tous les webhooks ont le même format JSON enveloppe :

```json
{
  "id": "wd_01H8K2J5N6P7Q8R9S0T1U2V3W4",
  "event": "PROJECT_CREATED",
  "created": 1746878400,
  "organization_id": "org_clx5y2z9k0001abc",
  "data": { ... },
  "api_version": "2026-05-09"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | UUID-like unique de cette livraison (idempotence côté receiver) |
| `event` | string enum | Type d'évènement (voir liste ci-dessous) |
| `created` | int (unix sec) | Timestamp de création du payload |
| `organization_id` | string cuid | Org concernée |
| `data` | object | Payload métier spécifique à l'event |
| `api_version` | string | Version du schéma payload (date YYYY-MM-DD) |

---

## 2. Headers HTTP envoyés

| Header | Description |
|--------|-------------|
| `Content-Type` | Toujours `application/json` |
| `User-Agent` | `Renocal-Webhooks/1.0` |
| `X-Renocal-Event` | Type d'évènement (redondant avec `event` du body) |
| `X-Renocal-Delivery` | UUID de la livraison (= `id` du body) |
| `X-Renocal-Signature` | **Signature HMAC-SHA256** (voir section 3) |

---

## 3. Validation de signature HMAC-SHA256

### Format du header

```
X-Renocal-Signature: t=1746878400,v1=a3b9c1d4e5f6...
```

| Champ | Description |
|-------|-------------|
| `t=<unix_sec>` | Timestamp de signature (anti-replay) |
| `v1=<hex>` | Signature HMAC-SHA256 du payload |

Plusieurs `v1=` peuvent être présents simultanément pendant une rotation de secret.

### Algorithme de validation

```
1. Parser t et v1[] depuis le header
2. Si |now() - t| > 300 secondes (5 min) → REJETER
3. Construire signed_payload = t + "." + raw_body
4. Calculer expected = HMAC_SHA256(secret, signed_payload).hex()
5. Pour chaque v1 :
     Si timing_safe_compare(v1, expected) == true → VALIDE
6. Sinon → REJETER
```

⚠ **Toujours utiliser une comparaison constant-time** pour éviter le timing attack :
- Node : `crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))`
- Python : `hmac.compare_digest(a, b)`
- Java : `MessageDigest.isEqual(a, b)`
- Go : `subtle.ConstantTimeCompare(a, b)`

### Exemple curl pour tester votre receiver localement

```bash
SECRET="whsec_test1234567890abcdef1234567890ab"
PAYLOAD='{"event":"TEST","data":{}}'
TS=$(date +%s)
SIGNED="$TS.$PAYLOAD"
SIG=$(echo -n "$SIGNED" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/webhooks/renocal \
  -H "Content-Type: application/json" \
  -H "X-Renocal-Event: TEST" \
  -H "X-Renocal-Delivery: test-$(uuidgen)" \
  -H "X-Renocal-Signature: t=$TS,v1=$SIG" \
  -d "$PAYLOAD"
```

---

## 4. Idempotence

Un webhook peut être livré **plusieurs fois** dans des cas de retry réseau, fail-over, etc.
Votre receiver DOIT être idempotent, c'est-à-dire produire le même résultat si le même payload est reçu plusieurs fois.

**Méthode recommandée** : tracker les `X-Renocal-Delivery` déjà traités (TTL 24h suffisant).

```python
# Pseudo-code
if redis.exists(f"webhook:processed:{delivery_id}"):
    return 200, "duplicate"
redis.setex(f"webhook:processed:{delivery_id}", 86400, "1")
process(payload)
return 200, "received"
```

---

## 5. Politique de retry côté Réno·Calc Pro

Si votre receiver répond avec un status HTTP **autre que 2xx**, ou ne répond pas dans les **10 secondes**, Réno·Calc Pro réessaie selon le calendrier suivant :

| Tentative | Délai après précédente |
|-----------|------------------------|
| 1 | immédiat |
| 2 | 1 min |
| 3 | 5 min |
| 4 | 30 min |
| 5 | 2 h |
| 6 | 6 h |
| 7 | 24 h |

Après **30 échecs consécutifs** sur le même endpoint, le webhook est **désactivé automatiquement** et un email est envoyé à l'admin org.

---

## 6. Liste exhaustive des évènements

### Projets

#### `PROJECT_CREATED`
Émis quand un nouveau projet est créé (UI ou API).
```json
{
  "data": {
    "project": {
      "id": "clx...",
      "name": "Maison Dupont",
      "surfaceM2": 95,
      "buildingType": "maison",
      "createdAt": "2026-05-10T08:30:00Z"
    }
  }
}
```

#### `PROJECT_UPDATED`
Émis sur modification (champs métiers, pas l'enveloppe entière).
```json
{ "data": { "project": { "id": "clx...", "changedFields": ["surfaceM2", "address"] } } }
```

#### `PROJECT_ARCHIVED`
Émis quand un projet passe au statut `ARCHIVED`.
```json
{ "data": { "project": { "id": "clx...", "archivedAt": "2026-05-10T..." } } }
```

### Rapports

#### `REPORT_QUEUED`
Émis dès qu'un rapport est mis en file de génération.
```json
{ "data": { "report": { "id": "rpt_...", "template": "AUDIT_PARTICULIER", "status": "pending" }, "projectId": "clx..." } }
```

#### `REPORT_READY`
Émis quand le PDF est disponible. Récupérable via `GET /api/v1/reports/{id}/pdf`.
```json
{ "data": { "report": { "id": "rpt_...", "status": "ready", "pdfUrl": "https://...", "sha256": "abc..." } } }
```

#### `REPORT_FAILED`
Émis si la génération a échoué.
```json
{ "data": { "report": { "id": "rpt_...", "status": "failed" }, "error": "template_render_error", "willRetry": false } }
```

### Facturation

#### `PAYMENT_SUCCEEDED`
Émis sur paiement Stripe réussi.
```json
{ "data": { "invoiceId": "in_...", "amountPaid": 9900, "currency": "eur", "periodStart": 1746000000, "periodEnd": 1748678400 } }
```

#### `PAYMENT_FAILED`
Émis sur échec paiement.
```json
{ "data": { "invoiceId": "in_...", "amountDue": 9900, "currency": "eur", "attemptCount": 2 } }
```

#### `SUBSCRIPTION_UPDATED`
Émis sur création / modif / annulation abonnement.
```json
{ "data": { "status": "ACTIVE", "stripeSubscriptionId": "sub_...", "cancelAtPeriodEnd": false, "currentPeriodEnd": 1748678400 } }
```

### IA & Catalogue

#### `MATERIAL_IDENTIFIED`
Émis quand l'IA Vision identifie un matériau avec confiance > 50 %.
```json
{
  "data": {
    "projectId": "clx...",
    "category": "wall",
    "topMatch": { "materialId": "wall-cut-stone", "name": "Pierre de taille", "confidencePct": 78, "rationale": "..." },
    "allSuggestions": [...],
    "mode": "vision"
  }
}
```

#### `CATALOG_OVERRIDE_ACTIVATED` (broadcast cross-org)
Émis quand un override catalogue est activé par Réno·Calc Pro.
**⚠ Diffusé à TOUTES les orgs ayant un webhook abonné** (pas seulement l'org propriétaire).
```json
{ "data": { "kind": "MATERIAL", "entryId": "wall-cut-stone", "patch": { "thermal": { "lambda": 2.6 } }, "reason": "Alignement FDES 2026" } }
```

#### `CATALOG_OVERRIDE_DEACTIVATED` (broadcast cross-org)
Symétrique.

---

## 7. Best practices

✅ **Répondre 2xx en < 10s** — toujours, sinon retry
✅ **Idempotence** via `X-Renocal-Delivery`
✅ **Validation HMAC** systématique en production
✅ **Logger les requests** (signature, event, delivery_id) pour debug
✅ **Surveiller failures** dans `/admin/webhook-deliveries` côté Réno·Calc
✅ **Rotation secret** : créer nouveau webhook, double-écoute pendant 7j, supprimer ancien
✅ **HTTPS uniquement** en production (HTTP refusé)

❌ **Ne PAS traiter le payload de manière synchrone** si > 1s — utiliser une queue
❌ **Ne PAS exposer le secret** dans logs/erreurs
❌ **Ne PAS faire confiance à l'IP source** comme seule auth (utiliser HMAC)

---

## 8. Migration / versioning

Le champ `api_version` du payload permet de tracer l'évolution du schéma.

Si Réno·Calc Pro modifie le shape d'un payload (breaking change rare), l'ancien shape continue d'être envoyé pendant **6 mois** en parallèle, avec préfixe `_legacy` sur les nouveaux champs incompatibles. Communication par email à l'admin org 60j avant.

---

## 9. Support

- 📧 contact@renocalcpro.fr
- 📚 [Centre d'aide](https://renocalcpro.fr/fr/help/api-key)
- 🐛 Bug ? Ouvrir un ticket sur [renocalcpro.fr/help/contact](https://renocalcpro.fr/fr/help)
