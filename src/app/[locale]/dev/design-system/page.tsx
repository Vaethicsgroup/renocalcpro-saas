// app/[locale]/dev/design-system/page.tsx
// Page interne : visualisation du design system Premium v2.0.

import { ThemeShowcase } from "@/components/dev/ThemeShowcase";

export const dynamic = "force-static";

export default function DesignSystemPage() {
  return <ThemeShowcase />;
}
