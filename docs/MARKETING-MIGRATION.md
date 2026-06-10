# Migration sections marketing vers UI v2

> Status Sprint v2.3 : audit terminé, plan documenté, **pas de refonte forcée**
> car les sections existantes respectent déjà la palette Tailwind v2 via héritage.

## Sections concernées (10 composants)

Localisation : `saas/src/components/marketing/*.tsx`

| Section | État palette v2 | Composants UI v2 | Reco |
|---|---|---|---|
| `HeroPremium.tsx` | ✅ Refondu v2.0 | natif | Garder tel quel |
| `HeaderPremium.tsx` | ✅ Refondu v2.0 | natif | Garder tel quel |
| `FooterPremium.tsx` | ✅ Refondu v2.0 | natif | Garder tel quel |
| `Hero.tsx` (legacy) | 🟡 Re-export | n/a | Supprimer Sprint v2.4 |
| `SegmentSplit.tsx` | ✅ Palette teal/amber héritée | inline | Pas urgent |
| `TrustBar.tsx` | ✅ Palette neutre | inline | Pas urgent |
| `FeatureCarousel.tsx` | ✅ Palette teal | inline | Migrer vers `<Card>` Sprint v2.4 |
| `PdfShowcase.tsx` | ✅ Palette stone/teal | inline | Pas urgent |
| `BenefitGrid.tsx` | ✅ Palette teal-amber | inline | Migrer vers `<Card>` Sprint v2.4 |
| `ComparisonTable.tsx` | ✅ Couleurs neutres | inline | Pas urgent |
| `HowItWorks.tsx` | ✅ Palette teal/amber | inline | Migrer vers `<Card>` Sprint v2.4 |
| `PricingTable.tsx` | 🟡 Legacy — `PricingPremium` plus complet | n/a | Remplacer par PricingPremium |
| `FAQ.tsx` | ✅ Accordion natif | inline | Pas urgent |
| `CTASection.tsx` | ✅ Bg teal-900 | inline | Migrer vers `<Button>` v2 Sprint v2.4 |
| `SegmentSuggestion.tsx` | ✅ Sticky bottom | inline | Pas urgent |

## Pourquoi le report Sprint v2.4

1. **Palette héritée** : la refonte Tailwind config v2.0 (palette teal/sage/copper) s'applique automatiquement à toutes les classes Tailwind existantes. Pas de bug visuel constaté.
2. **Risque régression** : 9 fichiers à toucher avec tests Playwright à mettre à jour pour chaque sélecteur textuel. Hors scope sprint polish.
3. **i18n** : les sections existantes utilisent `useTranslations()` correctement — pas besoin de réécrire.

## Pattern de migration (pour Sprint v2.4)

### Avant (legacy)
```tsx
<section className="bg-teal-900 px-6 py-24">
  <h2 className="font-serif text-4xl font-bold text-white">…</h2>
  <a href="…" className="rounded-lg bg-amber-400 px-6 py-3 text-teal-950">CTA</a>
</section>
```

### Après (v2)
```tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

<section className="bg-teal-900 px-6 py-24">
  <h2 className="font-serif text-4xl font-bold text-white">…</h2>
  <Button variant="primary" size="lg">
    <Link href="…">CTA</Link>
  </Button>
</section>
```

## Composants UI v2 disponibles

- `<Button variant="primary|secondary|ghost|destructive" size="sm|md|lg">` (Sprint v2.0)
- `<Card variant="default|featured|interactive">` (Sprint v2.0)
- `<Input>`, `<Textarea>`, `<Select>`, `<FormField>` (Sprint v2.0)
- `<Badge>`, `<StatusBadge>`, `<PlanBadge>`, `<RoleBadge>` (Sprint v2.0)
- `<KpiCard>` avec sparkline (Sprint v2.0)
- `<EmptyState>` (Sprint v2.0)
- `<DPELabel>`, `<ComfortGauge>`, `<AidsBreakdown>` (Sprint v2.0)

## Action Sprint v2.3 (cette session)

- ✅ Audit fait
- ✅ Plan documenté
- ✅ Composants legacy stub-isés (Hero.tsx, PublicHeader.tsx, PublicFooter.tsx)
- ⏳ Refactor sections : reporté Sprint v2.4 (faible priorité)
