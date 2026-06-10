# Assistant IA métier — Réno·Calc Pro

## Vision

L'assistant IA de Réno·Calc Pro n'est **pas un chatbot support produit**. C'est un **assistant métier de guidage du diagnostic** énergétique. Il accompagne activement l'utilisateur (particulier ou professionnel) dans :

- le **remplissage** de chaque section et chaque champ du diagnostic,
- l'**identification** des matériaux, isolants et systèmes du bâti,
- l'**aide au choix** entre plusieurs options de travaux,
- la **compréhension** des aides financières mobilisables,
- l'**explication** des résultats (DPE estimé, scénarios, ROI).

Il s'adapte au profil utilisateur (particulier, auditeur, diagnostiqueur, artisan, BE, accompagnateur) en faisant varier le registre, le niveau technique et les références citées.

---

## Architecture

```
saas/src/lib/ai/assistant/
├── types.ts                    # types partagés (persona, contexte, message…)
├── client.ts                   # client Anthropic + mode MOCK (pas de clé)
├── sanitizer.ts                # anonymisation PII (RGPD art. 5.1.c)
├── guards.ts                   # garde-fous post-LLM (no invention, expert review)
├── context-builder.ts          # injection ciblée knowledge slice par contexte
├── prompts/
│   ├── base.ts                 # system prompt de base + garde-fous
│   ├── personas.ts             # 6 registres adaptés au profil utilisateur
│   ├── contexts.ts             # 8 modes selon contexte d'ouverture
│   └── index.ts                # composeur de prompts
└── knowledge/
    ├── field-help.ts           # ~50 champs : que mettre / mesurer / pourquoi utile
    ├── section-help.ts         # vue d'ensemble par section + checklist
    ├── recognize.ts            # comment reconnaître matériaux/isolants/systèmes
    ├── comparators.ts          # comparateurs structurés "aide au choix"
    └── aids-help.ts            # aides financières expliquées (MPR, CEE, PTZ…)

saas/src/components/ai-assistant/
├── AssistantProvider.tsx       # React context + état conversation
├── AssistantPanel.tsx          # panneau latéral (messages + input + feedback)
├── AssistantFloater.tsx        # bouton flottant bas-droite
├── FieldHelper.tsx             # icône "?" inline à côté d'un label
├── QuickActions.tsx            # raccourcis Explique-moi / Aide-moi / Sais-pas
├── ConfidenceBadge.tsx         # pastille certain/estimé/incertain/inconnu
└── index.ts                    # re-exports

saas/src/app/api/ai-assistant/
├── route.ts                    # POST conversation (sync, streaming v2)
└── feedback/route.ts           # POST helpful / pas helpful + commentaire

prisma/schema.prisma            # +3 modèles : AssistantConversation, Message, Feedback
prisma/migrations/20260510_assistant_ia/
```

## Modèle de données

| Modèle | Rôle |
|--------|------|
| `AssistantConversation` | Une session ouverte par un utilisateur. Contient persona, contextType, projetId optionnel, locale, version de prompt, cumul tokens, closedAt. |
| `AssistantMessage` | Un message dans la conversation : rôle (USER/ASSISTANT/SYSTEM_NOTE), contenu **anonymisé**, niveau de confiance, sources citées, garde-fous déclenchés. |
| `AssistantFeedback` | Feedback utilisateur sur un message : helpful bool, issueKind (incorrect / off_topic / too_technical / outdated / …), commentaire libre. |

**Rétention** : 90 jours par défaut (cron à programmer), conformément au principe de minimisation RGPD.

**PII** : tous les `content` sont passés dans `sanitizeText()` avant stockage. Email, téléphone, IBAN, NIR, SIRET, mots de passe sont systématiquement masqués. L'adresse est masquée si l'option `maskAddress` est active (true par défaut côté API).

---

## Personas

| Persona | Registre |
|---------|----------|
| `INDIVIDUAL` | Particulier — langage simple, ton rassurant, exemples grand public |
| `PRO_AUDITEUR` | Auditeur OPQIBI — technique dense, normes citées, valeurs systématiques |
| `PRO_DIAGNOSTIQUEUR` | Diagnostiqueur DPE — précis, normatif (arrêté 4 mai 2022) |
| `PRO_ARTISAN` | Artisan RGE — orienté chantier, pose, DTU |
| `PRO_BE` | Bureau d'études — modélisation, sensibilités, hypothèses |
| `PRO_ACCOMPAGNATEUR` | Mon Accompagnateur Rénov' — pédagogique, parcours administratif, aides |

Le persona est défini dans `<AssistantProvider initialPersona="…">` au niveau du layout. L'utilisateur peut le surcharger en cours de conversation via `setPersona()`.

---

## Contextes d'ouverture

| ContextType | Quand l'ouvrir | Knowledge mobilisée |
|-------------|----------------|---------------------|
| `FORM_FIELD` | Clic sur "?" à côté d'un champ | `FIELD_HELP` du champ |
| `FORM_SECTION` | Clic sur "Aide section" en haut d'une section | `SECTION_HELP` |
| `CHOICE_HELP` | Clic sur "Aide-moi à choisir" | `COMPARATORS` |
| `RESULT_EXPLAIN` | Clic sur un chiffre dans les résultats | snapshot projet anonymisé |
| `AID_EXPLAIN` | Clic sur "Pourquoi cette aide ?" | `AIDS_HELP` |
| `MATERIAL_RECOGNIZE` | "Comment reconnaître ce matériau ?" | `RECOGNIZE_GUIDES` (material) |
| `SYSTEM_RECOGNIZE` | "Comment reconnaître ce système ?" | `RECOGNIZE_GUIDES` (system) |
| `GENERAL` | Bouton flottant général | aucune injection — l'utilisateur précise |

Chaque contexte injecte **uniquement la tranche de connaissance utile** dans le system prompt, pour minimiser les tokens et éviter les divagations.

---

## Garde-fous

Appliqués dans `lib/ai/assistant/guards.ts` après chaque réponse LLM :

1. **`regulatory_no_source`** — claim réglementaire détecté sans source officielle → confidence baissée d'un cran.
2. **`aid_amount_no_source`** — mention d'une aide chiffrée sans source `AIDS_HELP` → tag.
3. **`precise_numbers_no_source`** — chiffres "trop précis" (5+ digits, ou pourcentage avec décimale) sans source → confidence baissée.
4. **`indicative_prices`** — prix précis détectés → tag (prix indicatifs uniquement).
5. **`expert_verification_added`** — pour `CHOICE_HELP` ou `AID_EXPLAIN` sans mention de vérification → ajout automatique d'une note "vérifiez sur france-renov.gouv.fr".

Tous ces garde-fous sont stockés dans `AssistantMessage.guardsTriggered` pour observabilité et amélioration continue.

---

## Niveaux de confiance

L'assistant déclare honnêtement le niveau de fiabilité de chaque réponse :

| Niveau | Signification | Affichage |
|--------|--------------|-----------|
| `CERTAIN` | Info factuelle vérifiée (norme, fiche produit) | Pastille verte |
| `ESTIMATED` | Estimation pédagogique étayée + hypothèses | Pastille ambre |
| `UNCERTAIN` | Hypothèse à confirmer humainement | Pastille orange |
| `UNKNOWN` | L'assistant refuse poliment → orientation expert | Pastille grise |

Les garde-fous peuvent **dégrader** un niveau auto-déclaré (CERTAIN → ESTIMATED) si suspicion d'invention.

---

## Intégration dans une page

### Pattern 1 — Provider au layout

```tsx
// app/[locale]/o/layout.tsx (Pro)
import { AssistantProvider, AssistantPanel, AssistantFloater } from "@/components/ai-assistant";

<AssistantProvider initialPersona="PRO_AUDITEUR" locale="fr">
  {children}
  <AssistantPanel />
  <AssistantFloater />
</AssistantProvider>
```

### Pattern 2 — Icône inline sur champ

```tsx
import { FieldHelper } from "@/components/ai-assistant";

<label>
  Surface habitable (m²)
  <FieldHelper fieldRef="project.surfaceM2" fieldLabel="Surface habitable" />
</label>
```

### Pattern 3 — Ouverture programmatique

```tsx
import { useAssistant } from "@/components/ai-assistant";

const { open } = useAssistant();

<button onClick={() => open({
  contextType: "CHOICE_HELP",
  contextRef: "wall_insulation",
  contextLabel: "Quel isolant murs ?",
})}>
  ⚖️ Aide-moi à choisir
</button>
```

### Pattern 4 — Avec snapshot projet

```tsx
open({
  contextType: "RESULT_EXPLAIN",
  contextLabel: "Mon DPE estimé",
  payload: { projectSnapshot: project },  // sera anonymisé automatiquement
});
```

---

## API

### `POST /api/ai-assistant`

Body :
```json
{
  "conversationId": "...",            // optionnel, créée si absent
  "persona": "INDIVIDUAL",
  "contextType": "FORM_FIELD",
  "contextRef": "project.surfaceM2",
  "payload": { /* AssistantContextPayload */ },
  "userMessage": "Comment je mesure ma surface ?",
  "locale": "fr",
  "projectId": "..."                   // optionnel
}
```

Réponse (200) :
```json
{
  "conversationId": "...",
  "messageId": "...",
  "message": {
    "role": "assistant",
    "content": "...",
    "confidence": "ESTIMATED",
    "sources": [{ "kind": "help", "ref": "...", "label": "..." }],
    "guardsTriggered": ["..."]
  },
  "followUpSuggestions": ["...", "..."],
  "tokensRemaining": 18532
}
```

Codes d'erreur :
- `401` non authentifié
- `400` invalid_json / missing_user_message / user_message_too_long
- `429` conversation_token_cap_reached
- `502` llm_error

### `POST /api/ai-assistant/feedback`

```json
{
  "conversationId": "...",
  "messageId": "...",
  "helpful": true,
  "issueKind": "incorrect",       // optionnel
  "comment": "..."                 // optionnel, < 2000 chars
}
```

---

## Mode MOCK

Si `ANTHROPIC_API_KEY` est absent (dev local, CI), l'assistant retourne des **réponses stub** plausibles selon le contexte. Les garde-fous ne sont pas court-circuités et la conversation est persistée normalement. Idéal pour tester l'UX sans coût LLM.

---

## Limites & roadmap

**MVP actuel (Sprint 25)** :
- ✅ ~50 champs documentés (FIELD_HELP)
- ✅ 6 sections complètes (SECTION_HELP)
- ✅ 8 guides reconnaissance matériaux/systèmes (RECOGNIZE_GUIDES)
- ✅ 2 comparateurs structurés (COMPARATORS)
- ✅ 5 aides expliquées (AIDS_HELP)
- ✅ 6 personas + 8 contextes
- ✅ Sanitizer PII + 5 garde-fous
- ✅ UI : Panel + Floater + FieldHelper + QuickActions
- ✅ API sync (streaming v2)

**Sprint 26+** :
- Streaming SSE des réponses (UX plus réactive)
- Élargir FIELD_HELP à 100+ champs
- Élargir COMPARATORS à 10+ comparateurs
- Plus de guides RECOGNIZE
- i18n EN/ES/DE/PT du knowledge base
- Cron purge conversations > 90 jours
- Dashboard admin /admin/ai-assistant (volume, helpful rate, garde-fous fréquents)
- A/B test promptVersion (v1.2026-05 vs v2.x)
- Intégration directe dans formulaires diagnostic existants (Vite + Next)
- Suggestion automatique d'ouverture (utilisateur reste 30s sur un champ → "Besoin d'aide ?")

---

## RGPD & données personnelles

L'assistant respecte strictement la minimisation des données :

- **PII masquées** systématiquement avant envoi LLM ET avant stockage (email, téléphone, IBAN, NIR, SIRET, mots de passe).
- **Adresse** : masquée par défaut côté API (option `maskAddress: true`).
- **Noms propres** : masqués si suspectés (préfixes M./Mme/Mlle).
- **Snapshot projet** : anonymisé via `buildAnonymousProjectSnapshot()` avant envoi.
- **Rétention** : 90 jours, purge automatique (cron à programmer dans Sprint 26).
- **Logs** : aucun log brut de message utilisateur dans Loki — uniquement compteurs anonymes.

Les conversations restent visibles à l'utilisateur dans son espace (à venir : `/o/ai-assistant/history` et `/p/ai-assistant/history`).

---

## Contribuer à la base de connaissance

Pour ajouter un champ documenté, éditer `lib/ai/assistant/knowledge/field-help.ts` :

```ts
"section.subsection.field": {
  ref: "section.subsection.field",
  label: "Libellé court",
  whatToPut: "Réponse à 'que dois-je mettre ici ?'",
  howToMeasure: "Réponse à 'comment mesurer ?'",
  whyUseful: "Réponse à 'pourquoi utile ?'",
  commonMistakes: ["..."],
  whenUnknown: "...",
  relatedHelp: ["slug-article-help"],
  impactOnResult: "high",
},
```

Pour ajouter un comparateur, éditer `comparators.ts` en suivant le schéma `Comparator`.

Pour ajouter un guide reconnaissance, éditer `recognize.ts` en suivant le schéma `RecognizeGuide`.

---

## Tests

```bash
cd saas
npm test -- ai-assistant
```

Couverture actuelle : sanitizer, guards, knowledge accessors, context-builder, prompts, i18n locale-aware, abtest-prompt, degraded mode. Tests E2E Playwright dans `e2e/ai-assistant.spec.ts`.

---

## Déploiement OVH (Sprint 29)

### Variables d'environnement requises

À ajouter dans `/etc/renocal/.env.production` (ou via OVH Vault) :

```bash
# Anthropic LLM
ANTHROPIC_API_KEY=sk-ant-xxx                    # clé prod, monitoring usage activé
ASSISTANT_AI_MODEL=claude-sonnet-4-6
ASSISTANT_AI_MAX_TOKENS=1200
ASSISTANT_AI_MAX_TOKENS_PER_CONV=20000

# Voice transcription (optionnel — feature dégrade en mock si absent)
OPENAI_API_KEY=sk-xxx                           # pour Whisper transcription

# RGPD rétention
ASSISTANT_RETENTION_DAYS=90                     # purge cron J+90
CRON_SHARED_SECRET=<random-256-bit>

# Récap admin global
ASSISTANT_GLOBAL_ADMIN_EMAILS=admin1@renocalcpro.fr,admin2@renocalcpro.fr

# A/B test prompts (rollout progressif)
ASSISTANT_PROMPT_TREATMENT_PCT=0                # 0 = tout le monde sur v1
ASSISTANT_PROMPT_FORCE_TREATMENT=               # CSV org IDs (debug/beta)
ASSISTANT_PROMPT_FORCE_CONTROL=                 # CSV org IDs (sensibles)

# Mode dégradé (incident response)
ASSISTANT_DEGRADED_MODE=false                   # true = bypass LLM, knowledge only

# Plugins (Sprint 29 préparation, désactivé par défaut)
ASSISTANT_PLUGINS=false
```

### Crontabs à installer

```cron
# Purge conversations > 90 jours (RGPD art. 5.1.c) — tous les lundis 04:00
0 4 * * 1   /opt/renocal/scripts/cron-purge-assistant.sh >> /var/log/renocal/cron-purge.log 2>&1

# Récap hebdo aux orgs Pro — chaque lundi 09:00
0 9 * * 1   /opt/renocal/scripts/cron-assistant-weekly-recap.sh >> /var/log/renocal/cron-recap.log 2>&1

# Récap mensuel admin global — 1er du mois 09:00
0 9 1 * *   curl -fsS -H "x-cron-secret: $CRON_SHARED_SECRET" https://renocalcpro.fr/api/cron/assistant-monthly-admin-recap >> /var/log/renocal/cron-admin-recap.log 2>&1
```

### Migrations à appliquer

Au déploiement initial, après pull du code :

```bash
cd /opt/renocal/saas
npx prisma migrate deploy
# Migrations Sprint 25-29 :
# - 20260510_assistant_ia
# - 20260510_assistant_soft_delete
# - 20260510_assistant_webhook
# - 20260510_assistant_org_toggle
# - 20260510_assistant_persona_agency
```

### Monitoring Prometheus

Les métriques `assistant_*` sont exposées sur `/api/metrics` (déjà scrappées). Dashboards Grafana à créer :

| Panel | Query | Seuil alerte |
|---|---|---|
| Conversations 24h | `sum(assistant_requests_total)` | < 10/jour = anomalie usage |
| Helpful rate | `assistant_helpful_ratio` | < 0.5 = revue prompt nécessaire |
| Tokens consommés | `sum(assistant_tokens_consumed)` | > seuil quota = upgrade plan ou limit |
| Garde-fous déclenchés | `sum(assistant_guards_triggered_total) by (guard)` | `degraded_mode_no_llm` > 100/h = LLM down |
| Latence P95 | `histogram_quantile(0.95, assistant_response_seconds_bucket)` | > 30s = investigation |

Alertmanager rules suggérées :

```yaml
- alert: AssistantHelpfulRateLow
  expr: assistant_helpful_ratio < 0.5
  for: 24h
  annotations:
    summary: "Helpful rate assistant < 50% sur 24h"

- alert: AssistantDegradedMode
  expr: increase(assistant_guards_triggered_total{guard="degraded_mode_no_llm"}[1h]) > 50
  for: 5m
  annotations:
    summary: "Mode dégradé déclenché >50 fois en 1h — vérifier Anthropic API"
```

### Troubleshooting

| Symptôme | Diagnostic | Solution |
|---|---|---|
| Mode dégradé activé partout | `ASSISTANT_DEGRADED_MODE=true` ou Anthropic API 5xx | Vérifier env + status.anthropic.com + tester `curl https://api.anthropic.com/v1/messages` avec clé |
| Conversations non purgées | Cron purge non exécuté | Vérifier `/var/log/renocal/cron-purge.log` + tester manuellement le script |
| Helpful rate 0% | Aucun feedback collecté | Vérifier que les boutons 👍👎 fonctionnent côté UI, console errors |
| Tokens explose | Conversations très longues | Réduire `ASSISTANT_AI_MAX_TOKENS_PER_CONV` ou cap par persona |
| Streaming SSE coupé | Caddy timeout / nginx buffering | Header `X-Accel-Buffering: no` (déjà présent dans route stream) + Caddy `flush_interval -1` |
| Voice input silencieux | OPENAI_API_KEY absent ou invalide | Vérifier env. Mode mock retourne stub fonctionnel pour démo |

### Rollback urgence

Si bug critique en prod détecté sur l'assistant :

```bash
# Désactiver l'assistant pour TOUTES les orgs
psql $DATABASE_URL -c "UPDATE \"Organization\" SET \"assistantEnabled\" = false;"

# OU activer mode dégradé global (knowledge brut, pas de LLM)
echo "ASSISTANT_DEGRADED_MODE=true" >> /etc/renocal/.env.production
systemctl restart renocal-web

# Communiquer aux clients via /status (incident manuel)
curl -X POST https://renocalcpro.fr/api/admin/incidents \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"title": "Assistant IA temporairement indisponible", "severity": "MINOR"}'
```

### Vérification post-déploiement

Smoke test minimum (5 minutes) :

1. ☐ `curl https://renocalcpro.fr/api/metrics | grep assistant_` → métriques présentes
2. ☐ `/admin/ai-assistant` accessible (auth admin) → KPI quartet remplis
3. ☐ Login compte test Pro → ouvrir bouton 🤖 → poser question → recevoir réponse
4. ☐ Login compte test Particulier → ouvrir 🤖 → réponse en mode sync (pas de stream)
5. ☐ Cliquer 👍 sur une réponse → check `/admin/ai-assistant/feedback` → entrée visible
6. ☐ Vérifier webhook ASSISTANT_FEEDBACK_RECEIVED si receiver configuré
7. ☐ Tester voice input (si OPENAI_API_KEY) → micro browser → transcription affichée
8. ☐ Tester export RGPD : `/o/ai-assistant/[id]` → bouton "Exporter JSON" → download .json
9. ☐ Tester suppression RGPD → confirmation → conversation absente du listing
10. ☐ Cron purge manuel : `bash /opt/renocal/scripts/cron-purge-assistant.sh` → logs OK

---

## Versions et historique

| Sprint | Version | Highlights |
|---|---|---|
| 25 | v1.0 | Création (data model, knowledge 25, prompts, garde-fous, UI, API sync) |
| 26 | v1.1 | Knowledge 55, streaming SSE, cron purge, dashboard admin, history, i18n EN |
| 27 | v1.2 | RGPD complet (art. 17, 20), 5 langues, intégration MaterialPicker, Prometheus, FIELD_HELP 100 |
| 28 | v1.3 | E2E tests, voice Whisper, mode dégradé, toggle org, persona AGENCY, receivers FEEDBACK |
| **29** | **v1.4** | **i18n complet 5 langues, GraphQL types, mobile voice, A11y AAA, plugins préparation, doc déploiement OVH** |

