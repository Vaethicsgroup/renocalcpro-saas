// app/[locale]/o/projects/[id]/enveloppe/page.tsx — Historique v2
"use client";

import { useTranslations } from "next-intl";
import {
  Activity,
  User,
  FileText,
  CheckCircle2,
  Edit3,
  Upload,
  Send,
  Eye,
  Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface ActivityEvent {
  id: string;
  ts: string;
  actor: string;
  actorKey?: string;
  initials: string;
  category: "EDIT" | "DOC" | "MILESTONE" | "SHARE" | "VIEW" | "AID";
  labelKey: string;
  detailKey?: string;
}

const TIMELINE: ActivityEvent[] = [
  { id: "e1", ts: "2026-06-02 14:32", actor: "Jean Dupont", initials: "JD", category: "AID", labelKey: "e1_label", detailKey: "e1_detail" },
  { id: "e2", ts: "2026-05-30 16:15", actor: "Marie Leroy", initials: "ML", category: "DOC", labelKey: "e2_label", detailKey: "e2_detail" },
  { id: "e3", ts: "2026-05-28 11:42", actor: "", actorKey: "actorPM", initials: "PM", category: "VIEW", labelKey: "e3_label", detailKey: "e3_detail" },
  { id: "e4", ts: "2026-05-25 09:30", actor: "Jean Dupont", initials: "JD", category: "SHARE", labelKey: "e4_label", detailKey: "e4_detail" },
  { id: "e5", ts: "2026-05-22 17:08", actor: "Jean Dupont", initials: "JD", category: "MILESTONE", labelKey: "e5_label" },
  { id: "e6", ts: "2026-05-22 16:55", actor: "Jean Dupont", initials: "JD", category: "EDIT", labelKey: "e6_label", detailKey: "e6_detail" },
  { id: "e7", ts: "2026-05-21 14:20", actor: "Marie Leroy", initials: "ML", category: "EDIT", labelKey: "e7_label", detailKey: "e7_detail" },
  { id: "e8", ts: "2026-05-18 10:15", actor: "Marie Leroy", initials: "ML", category: "DOC", labelKey: "e8_label", detailKey: "e8_detail" },
  { id: "e9", ts: "2026-05-15 14:00", actor: "Jean Dupont", initials: "JD", category: "MILESTONE", labelKey: "e9_label" },
  { id: "e10", ts: "2026-05-10 09:00", actor: "Jean Dupont", initials: "JD", category: "EDIT", labelKey: "e10_label", detailKey: "e10_detail" },
];

const CATEGORY_META: Record<ActivityEvent["category"], { Icon: typeof Activity; color: string }> = {
  EDIT: { Icon: Edit3, color: "bg-forest-100 text-forest-700" },
  DOC: { Icon: Upload, color: "bg-info-100 text-info-700" },
  MILESTONE: { Icon: CheckCircle2, color: "bg-forest-200 text-forest-800" },
  SHARE: { Icon: Send, color: "bg-amber-100 text-amber-700" },
  VIEW: { Icon: Eye, color: "bg-stone-100 text-stone-700" },
  AID: { Icon: Coins, color: "bg-terracotta-100 text-terracotta-700" },
};

export default function HistoriquePage() {
  const t = useTranslations("oHistory");
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <ol className="relative space-y-4 border-l border-cream-300 pl-6">
            {TIMELINE.map((e) => {
              const meta = CATEGORY_META[e.category];
              const Icon = meta.Icon;
              const actorName = e.actorKey ? t(e.actorKey) : e.actor;
              return (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[33px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-white ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="rounded-lg border border-cream-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-forest-900">{t(e.labelKey)}</p>
                        {e.detailKey && <p className="mt-0.5 text-xs text-stone-600">{t(e.detailKey)}</p>}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-stone-500">
                        {e.ts}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-forest-700 text-[9px] font-bold text-white">
                        {e.initials}
                      </span>
                      {t("byActor", { actor: actorName })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
