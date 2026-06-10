// components/onboarding/OnboardingStepper.tsx — Indicateur d'étapes onboarding v2.0

interface Step { key: string; label: string }

interface Props {
  steps: Step[];
  currentStep: number; // 0-indexed
}

export function OnboardingStepper({ steps, currentStep }: Props) {
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes onboarding">
      {steps.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                done
                  ? "bg-success-600 text-white"
                  : active
                    ? "bg-teal-700 text-white ring-4 ring-teal-100"
                    : "bg-stone-100 text-stone-400",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={["hidden text-sm font-medium sm:inline", active ? "text-teal-800" : done ? "text-stone-700" : "text-stone-400"].join(" ")}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={["mx-1 hidden h-px w-8 sm:block", done ? "bg-success-600" : "bg-stone-200"].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
