// components/ui/LoadingSpinner.tsx — Spinner aux couleurs de la marque.

interface Props {
  size?: number;
  branded?: boolean;
  label?: string;
}

export function LoadingSpinner({ size = 32, branded = true, label = "Chargement…" }: Props) {
  if (!branded) {
    return (
      <div role="status" aria-label={label} className="inline-block animate-spin rounded-full border-2 border-stone-200 border-t-teal-700"
           style={{ width: size, height: size }}>
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 50 50"
      role="status" aria-label={label}
      className="animate-spin"
    >
      <defs>
        <linearGradient id="spinner-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f6e56"/>
          <stop offset="50%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#a16207"/>
        </linearGradient>
      </defs>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#e7e5e4" strokeWidth="4" />
      <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinner-grad)" strokeWidth="4"
              strokeLinecap="round" strokeDasharray="80 60" />
      <span className="sr-only">{label}</span>
    </svg>
  );
}
