// app/[locale]/(auth)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <header className="border-b border-stone-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-teal-800 text-white">R</span>
            Réno·Calc Pro
          </Link>
        </div>
      </header>
      <main className="px-6 py-12">{children}</main>
    </div>
  );
}
