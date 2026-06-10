# AI Assistant Skills — système de plugins (Sprint 29 préparation)

## Vision

Permettre aux organisations Pro d'enrichir l'assistant IA de Réno·Calc avec leurs **propres skills métier** sans modifier le cœur du produit.

**Cas d'usage typiques** :
- Cabinet d'audit spécialisé (hôtellerie, médico-social) ajoute ses propres FIELD_HELP
- Bureau d'études crée ses comparateurs internes
- Accompagnateur Mon Accompagnateur Rénov' personnalise les prompts personas

## Architecture

```
saas/src/lib/ai/assistant/plugins/
├── types.ts        # AssistantPluginManifest + signatures hooks
└── loader.ts       # registre + cache mémoire + EXAMPLE_MANIFEST
```

## Format manifest (manifest.json)

```json
{
  "id": "cabinet-alpha-skills",
  "name": "Cabinet Alpha — skills personnalisés",
  "description": "Champs et comparateurs spécifiques à Cabinet Alpha.",
  "author": { "name": "Jean Dupont", "email": "jean@cabinet-alpha.fr" },
  "version": "1.0.0",
  "targetPersonas": ["PRO_AUDITEUR", "PRO_BE"],
  "files": {
    "knowledge": ["knowledge/hotellerie-fields.json"],
    "comparators": ["comparators/erp-vs-hotel.json"]
  },
  "permissions": ["read:project", "write:audit_log"],
  "active": true
}
```

## Permissions disponibles

| Permission | Description |
|---|---|
| `read:project` | Accès au contexte projet courant |
| `write:audit_log` | Peut écrire dans l'audit log de l'org |
| `send:email` | Peut déclencher l'envoi d'un email transactionnel |
| `external:network` | Peut faire des fetch sortants (sandboxed) |

L'admin de l'org doit explicitement approuver chaque permission lors de l'installation.

## Hooks (Sprint 30+)

### `beforeLlmCall`
Modifie le system prompt avant envoi à Claude. Peut aborder l'appel (ex : refus politique data).

```ts
export const beforeLlmCall: BeforeLlmHook = async ({ persona, contextType, systemPrompt }) => {
  // Ex : injecter un contexte cabinet avant chaque réponse
  return {
    systemPrompt: systemPrompt + "\n\n[Contexte Cabinet Alpha : appliquer méthodologie XYZ]",
  };
};
```

### `afterLlmCall`
Filtre/enrichit la réponse avant affichage utilisateur.

```ts
export const afterLlmCall: AfterLlmHook = async ({ reply }) => {
  // Ex : ajouter une note avec lien interne intranet
  return {
    appendNote: "\n\nVoir notre wiki interne : https://intranet.cabinet-alpha.fr/proc-renov",
  };
};
```

## Sécurité

**Sprint 29 : préparation seulement**, plugins désactivés par défaut (`ASSISTANT_PLUGINS=false`).

Avant activation production (Sprint 30+), prévoir :
- Sandbox VM2 ou Cloudflare Workers pour exécution hooks (pas d'eval brut)
- Limites timeout 5 s par hook
- Pas d'accès `process` / `fs` / `require` arbitraire
- Audit log automatique de chaque hook trigger
- Code review obligatoire pour publication marketplace

## Workflow installation (à venir)

1. Org admin va sur `/o/settings/assistant/plugins`
2. Browse marketplace (`/marketplace/assistant-skills`)
3. Click "Installer" → preview manifest + permissions
4. Confirmation → upload manifest dans S3 + activation
5. Plugin actif sur prochaine conversation
6. Stats d'usage visible dans `/admin/ai-assistant/plugins`

## Workflow publication (à venir)

1. Développeur crée un dossier `my-plugin/` avec manifest + fichiers
2. `npx renocal-assistant-plugin validate my-plugin/` (CLI à créer)
3. Soumission via `/marketplace/submit`
4. Review code Réno·Calc Pro (qualité + sécurité)
5. Publication marketplace après validation

## Statut

✅ Types + manifest + loader (squelette)
✅ EXAMPLE_MANIFEST documenté
✅ Helper `validateManifest()` avec checks structurels
⏳ Sprint 30+ : sandbox d'exécution + UI marketplace + CLI validation + workflow publication
