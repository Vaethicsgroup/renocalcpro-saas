# Receivers ASSISTANT_FEEDBACK_RECEIVED

Cet exemple montre comment relayer les feedbacks utilisateurs de l'assistant IA Réno·Calc Pro vers Slack pour suivi équipe produit en temps réel.

## Setup express-feedback-to-slack.js

1. Configurer un Slack incoming webhook : https://api.slack.com/messaging/webhooks
2. Configurer un webhook dans `/o/settings/webhooks` pointant sur `https://votre-server/webhooks/renocal` avec event `ASSISTANT_FEEDBACK_RECEIVED`
3. Récupérer le secret HMAC affiché à la création
4. Lancer :
   ```bash
   npm install express
   RENOCAL_HMAC_SECRET=whsec_... \
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../... \
     node express-feedback-to-slack.js
   ```

## Format du payload reçu

```json
{
  "id": "evt_...",
  "event": "ASSISTANT_FEEDBACK_RECEIVED",
  "createdAt": "2026-05-10T14:09:07Z",
  "data": {
    "feedbackId": "cuid_...",
    "conversationId": "cuid_...",
    "messageId": "cuid_...",
    "helpful": true,
    "issueKind": null,
    "hasComment": false,
    "createdAt": "2026-05-10T14:09:07Z"
  }
}
```

**⚠️ Important** : le `comment` libre n'est volontairement **PAS inclus** dans le payload pour éviter toute fuite de PII vers les receivers tiers. Si vous avez besoin du commentaire, consultez directement la conversation dans l'app via l'URL `https://renocalcpro.fr/fr/o/ai-assistant/<conversationId>`.

## Sécurité

Le receiver vérifie obligatoirement :
- Header `X-Renocal-Signature: sha256=...` (HMAC SHA-256 du body avec le secret)
- Header `X-Renocal-Timestamp: <unix_seconds>` (anti-replay : refuse > 5 min écart)
- Comparaison timing-safe via `crypto.timingSafeEqual`

## Variantes possibles

- **Microsoft Teams** : remplacer le payload Slack par `MessageCard` Teams compatible
- **Discord** : utiliser `embeds` Discord
- **Notion / Linear** : créer une issue automatique si `helpful=false`
- **PagerDuty** : déclencher incident si helpful rate < seuil sur 24h glissantes
