// components/ui/Card.tsx — Card premium v3.0 « Energy Trust »
// Variants : default | featured | interactive
// Composés : <Card>, <CardHeader>, <CardTitle>, <CardDescription>,
//            <CardContent>, <CardFooter>
//
// v3.0 — palette Energy Trust :
//   - bg blanc pur (contraste sur fond cream)
//   - bordure douce cream-300 (#E7DDCC)
//   - featured : accent vert énergie léger (badge ★ Premium)
//   - interactive : hover lift discret avec ombre teintée bleu nuit

import { forwardRef, type HTMLAttributes } from "react";

type Variant = "default" | "featured" | "interactive";

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "border border-cream-300 bg-white shadow-card",
  featured:
    "border-2 border-forest-300 bg-gradient-to-br from-cream-50 to-white shadow-elevated",
  interactive:
    "card-hover-lift cursor-pointer border border-cream-300 bg-white shadow-card hover:border-forest-300",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", padded = true, className = "", children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl",
        VARIANT_CLASSES[variant],
        padded ? "p-6" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["mb-4 flex flex-col gap-1", className].join(" ")} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={["font-serif text-xl font-semibold text-stone-900 tracking-tight", className].join(" ")}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={["text-sm text-stone-600 leading-relaxed", className].join(" ")} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest}>{children}</div>;
}

export function CardFooter({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["mt-6 flex items-center justify-between", className].join(" ")} {...rest}>
      {children}
    </div>
  );
}
