// src/components/admin/DemoAdminBanner.tsx — i18n complet (server component)

import { getTranslations } from "next-intl/server";
import { ShieldOff, AlertTriangle } from "lucide-react";
import { detectAdminAccessMode } from "@/lib/auth/demo-admin";
import {
  DemoAdminExitButton,
  DemoAdminRefreshButton,
} from "@/components/auth/DemoAdminToggle";

interface Props {
  locale: string;
}

export async function DemoAdminBanner({ locale }: Props) {
  const mode = await detectAdminAccessMode();
  if (mode === "real" || mode === "none") return null;

  const t = await getTranslations({ locale, namespace: "demoAdmin" });
  const isDevBypass = mode === "dev-bypass";
  const label = isDevBypass ? t("bannerDevLabel") : t("bannerDemoLabel");
  const description = isDevBypass ? t("bannerDevDesc") : t("bannerDemoDesc");

  return (
    <div
      role="banner"
      aria-label={label}
      className="border-b-2 border-amber-300 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-50"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-700 text-white ring-2 ring-amber-300/50"
          >
            {isDevBypass ? (
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider">
              {label}
              {isDevBypass && (
                <span className="ml-2 rounded bg-amber-800/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-amber-200/30">
                  {t("bannerNonProd")}
                </span>
              )}
            </p>
            <p className="hidden text-[11px] text-amber-50/85 sm:block">
              {description}
            </p>
          </div>
        </div>

        {mode === "demo-cookie" && (
          <div className="flex shrink-0 gap-2">
            <DemoAdminRefreshButton />
            <DemoAdminExitButton />
          </div>
        )}
      </div>
    </div>
  );
}
