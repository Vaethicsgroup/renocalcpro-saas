// src/lib/email/send.ts
// Re-export pour compatibilité avec les routes API cron qui importent
// `sendEmail` depuis `@/lib/email/send`. La logique réelle vit dans
// `./index.ts`. Ce fichier maintient un point d'import alternatif.
export { sendEmail, EMAIL_MOCK } from "./index";
export type { SendResult } from "./index";
