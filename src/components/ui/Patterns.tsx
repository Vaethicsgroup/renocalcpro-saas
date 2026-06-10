// components/ui/Patterns.tsx — 3 patterns SVG décoratifs cohérents avec la marque.
// À utiliser en background de hero/CTA sections : <PatternHexagons />

interface PatternProps {
  opacity?: number;
  className?: string;
}

export function PatternHexagons({ opacity = 0.08, className }: PatternProps) {
  return (
    <svg
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex-pattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <path d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-pattern)" />
    </svg>
  );
}

export function PatternWaves({ opacity = 0.06, className }: PatternProps) {
  return (
    <svg
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="wave-pattern" x="0" y="0" width="160" height="80" patternUnits="userSpaceOnUse">
          <path d="M0 40 Q40 0 80 40 T160 40" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M0 60 Q40 20 80 60 T160 60" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave-pattern)" />
    </svg>
  );
}

export function PatternDots({ opacity = 0.10, className }: PatternProps) {
  return (
    <svg
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots-pattern)" />
    </svg>
  );
}
