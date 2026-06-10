// components/ui/Badge.tsx — Badge premium v3.0 « Energy Trust »
// Variants : status × 5, plan × 5, role × 4, neutral
//
// v3.0 — palette Energy Trust :
//   - plan free       : wash cream + texte bleu nuit (neutre discret)
//   - plan solo       : vert énergie clair
//   - plan pro        : orange solaire (CTA commercial)
//   - plan team       : bleu premium
//   - plan enterprise : bleu nuit profond (expert)
//   - status success  : vert énergie
//   - status warning  : amber
//   - status error    : rouge corail
//   - status info     : bleu premium

import type { HTMLAttributes } from "react";

type StatusVariant = "success" | "warning" | "error" | "info" | "neutral";
type PlanVariant = "free" | "solo" | "pro" | "team" | "enterprise";
type RoleVariant = "owner" | "admin" | "member" | "viewer";

const STATUS_CLASSES: Record<StatusVariant, string> = {
  success: "bg-success-100 text-success-800",
  warning: "bg-amber-100 text-amber-800",
  error:   "bg-error-100 text-error-700",
  info:    "bg-info-100 text-info-700",
  neutral: "bg-stone-100 text-stone-700",
};

const PLAN_CLASSES: Record<PlanVariant, string> = {
  free:       "bg-stone-100 text-stone-700",
  solo:       "bg-forest-100 text-forest-800",
  pro:        "bg-terracotta-500 text-white",      // ← solar (CTA commercial)
  team:       "bg-info-100 text-info-700",         // ← bleu premium
  enterprise: "bg-night-800 text-white",            // ← bleu nuit profond
};

const ROLE_CLASSES: Record<RoleVariant, string> = {
  owner:  "bg-terracotta-100 text-terracotta-700",
  admin:  "bg-forest-100 text-forest-800",
  member: "bg-stone-100 text-stone-700",
  viewer: "bg-stone-50 text-stone-500 border border-stone-200",
};

interface BaseProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md";
  dotColor?: string;
}

function buildClasses(extra: string, size: "sm" | "md") {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-0.5 text-xs";
  return ["inline-flex items-center gap-1 rounded-full font-semibold", sizeClass, extra].join(" ");
}

export function StatusBadge({ status, size = "md", dotColor, className = "", children, ...rest }: BaseProps & { status: StatusVariant }) {
  return (
    <span className={[buildClasses(STATUS_CLASSES[status], size), className].join(" ")} {...rest}>
      {dotColor && <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
      {children}
    </span>
  );
}

export function PlanBadge({ plan, size = "md", className = "", children, ...rest }: BaseProps & { plan: PlanVariant }) {
  return (
    <span className={[buildClasses(PLAN_CLASSES[plan], size), className].join(" ")} {...rest}>
      {children ?? plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

export function RoleBadge({ role, size = "md", className = "", children, ...rest }: BaseProps & { role: RoleVariant }) {
  return (
    <span className={[buildClasses(ROLE_CLASSES[role], size), className].join(" ")} {...rest}>
      {children ?? role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

/** Generic badge fallback */
export function Badge({ size = "md", className = "", children, ...rest }: BaseProps) {
  return (
    <span className={[buildClasses(STATUS_CLASSES.neutral, size), className].join(" ")} {...rest}>
      {children}
    </span>
  );
}
