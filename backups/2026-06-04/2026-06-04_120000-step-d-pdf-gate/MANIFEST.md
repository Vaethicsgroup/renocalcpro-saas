# Backup étape D — gate PDF (route neutralisée)

Date     : 2026-06-04 ~12:00
Reason   : Avant ajout du gate freemium dans la route PDF déjà neutralisée.

## État actuel observé
- Route /api/calc/pdf/route.ts est DÉJÀ neutralisée (29 lignes, retourne JSON 200).
- Aucun import React-PDF top-level dans la route.
- React-PDF reste isolé dans :
  - src/pdf/calc/theme.ts
  - src/pdf/calc/AuditReportDocument.tsx
  - src/components/pdf/PdfRendererInner.tsx
  - src/components/pdf/LazyPdfRenderer.tsx
  (aucun de ces fichiers n'est importé par la route PDF actuelle)
- Boot Next stable.

## Choix d'implémentation étape D
- Garder la route neutralisée (ne PAS rebrancher React-PDF).
- AJOUTER le gate freemium AVANT la réponse neutralisée.
- FREE demandant "full" → 402 plan_limit_reached + message strict.
- FREE demandant "watermarked_preview" → 200 mais "neutralized: true" (PDF gen pas activé).
- PRO/TRIAL/TEAM/ENTERPRISE → 200 neutralized.
- Le serveur RESCELLE le watermark via `shouldWatermarkPdf(plan)`.

Quand React-PDF sera stable et tu débloqueras la génération réelle :
- Le gate sera DÉJÀ en place — pas besoin de retoucher.
- Il suffira de remplacer "neutralized: true" par l'appel React-PDF.

## Restauration
cp backups/2026-06-04/2026-06-04_120000-step-d-pdf-gate/src/app/api/calc/pdf/route.ts.bak \
   src/app/api/calc/pdf/route.ts
