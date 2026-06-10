// components/admin/KpiCard.tsx — Carte KPI premium v2.6 (relief + accents)
// v2.6 : palette Forest & Cream, icône, accent latéral, delta coloré, hover.

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  hint?: string;
  icon?: string;
  tone?: "default" | "primary" | "warning" | "success";
}

export function KpiCard({ label, value, delta, positive, hint, icon, tone = "default" }: KpiCardProps) {
  const accentClass = {
    default: "before:bg-forest-300",
    primary: "before:bg-forest-700",
    warning: "before:bg-amber-400",
    success: "before:bg-emerald-500",
  }[tone];

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border border-cream-300 bg-white p-6 shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-lg hover:shadow-forest-900/10",
        // accent latéral gauche
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        accentClass,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-forest-700/80">{label}</div>
        {icon && (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-lg text-forest-700 ring-1 ring-forest-100 transition group-hover:bg-forest-100"
          >
            {icon}
          </span>
        )}
      </div>

      <div
        className="mt-3 font-serif text-3xl font-bold leading-tight text-forest-900 tabular-nums"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {value}
      </div>

      {delta != null && (
        <div
          className={[
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            positive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
          ].join(" ")}
        >
          <span aria-hidden>{positive ? "↑" : "↓"}</span>
          {delta}
        </div>
      )}

      {hint && <p className="mt-2 text-xs leading-relaxed text-forest-900/55">{hint}</p>}
    </div>
  );
}
