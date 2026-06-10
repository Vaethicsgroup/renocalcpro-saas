"use client";
// components/onboarding/SignupWizard.tsx — Wizard 5 écrans, navigation client.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  setClientType, setProSubSegment, requestMagicLink,
  setOnboardingAnswers, selectPlan,
} from "@/server/actions/onboarding";
import { suggestPlan } from "@/lib/onboarding/suggest-plan";
import type { ClientType, PrimaryGoal, SubscriptionPlan, SegmentSize } from "@prisma/client";

interface Props {
  initialType: "individual" | "pro" | null;
  initialPlan: string | null;
  initialStep: number;
}

export function SignupWizard({ initialType, initialPlan, initialStep }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // État local du wizard.
  const [step, setStep] = useState<number>(initialStep);
  const [clientTypeChoice, setClientTypeChoice] = useState<"individual" | "pro" | null>(initialType);
  const [proType, setProType] = useState<ClientType | null>(null);
  const [segmentSize, setSegmentSize] = useState<SegmentSize | null>(null);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(0);
  const [email, setEmail] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  // En MVP, l'orgId est créé au moment du magic-link callback. Avant, on stocke local.
  const orgId = "demo-org-id"; // placeholder mock — remplacé par session côté serveur

  function next(n: number) {
    setStep(n);
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(n));
    router.replace(url.pathname + url.search);
  }

  return (
    <div>
      {/* Stepper */}
      <ol aria-label="Étapes" className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <li
            key={n}
            aria-current={step === n ? "step" : undefined}
            className={`size-8 rounded-full text-center text-sm font-bold leading-8 ${
              step === n
                ? "bg-teal-800 text-white shadow"
                : step > n
                  ? "bg-teal-200 text-teal-900"
                  : "bg-stone-200 text-stone-500"
            }`}
          >
            {n}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {step === 1 && <Screen1 onPick={(c) => {
          setClientTypeChoice(c);
          if (c === "individual") next(3); else next(2);
        }} />}
        {step === 2 && (
          <Screen2
            onPick={(p, size, vol) => {
              setProType(p); setSegmentSize(size); setMonthlyVolume(vol);
              next(3);
            }}
          />
        )}
        {step === 3 && (
          <Screen3
            email={email}
            onSubmit={(em) => {
              setEmail(em);
              startTransition(async () => {
                await requestMagicLink(em, "/signup?step=4");
                next(4);
              });
            }}
            pending={pending}
          />
        )}
        {step === 4 && (
          <Screen4
            isPro={clientTypeChoice === "pro"}
            onPick={(g) => {
              setPrimaryGoal(g);
              startTransition(async () => {
                await setOnboardingAnswers(orgId, g, { monthlyVolume });
                next(5);
              });
            }}
          />
        )}
        {step === 5 && (
          <Screen5
            suggested={suggestPlan({
              clientType: clientTypeChoice === "individual" ? "INDIVIDUAL" : (proType ?? "PRO_OTHER"),
              segmentSize, monthlyVolume, primaryGoal,
            })}
            onPick={(p) => {
              startTransition(async () => {
                await selectPlan(orgId, p);
              });
            }}
            pending={pending}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Écran 1 — INDIVIDUAL vs PRO                                               */
/* -------------------------------------------------------------------------- */

function Screen1({ onPick }: { onPick: (c: "individual" | "pro") => void }) {
  const t = useTranslations("onboarding");
  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {t("step1Title")}
      </h1>
      <p className="mt-2 text-stone-600">{t("step1Subtitle")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onPick("individual")}
          className="rounded-xl border-2 border-stone-200 p-6 text-left transition hover:border-teal-500 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          <div aria-hidden className="text-4xl">🏠</div>
          <h3 className="mt-3 font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("individual")}
          </h3>
          <p className="mt-1 text-sm text-stone-600">{t("individualDesc")}</p>
        </button>
        <button
          onClick={() => onPick("pro")}
          className="rounded-xl border-2 border-stone-200 p-6 text-left transition hover:border-amber-500 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <div aria-hidden className="text-4xl">💼</div>
          <h3 className="mt-3 font-serif text-xl font-semibold text-amber-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("pro")}
          </h3>
          <p className="mt-1 text-sm text-stone-600">{t("proDesc")}</p>
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Écran 2 — sous-segmentation pro                                           */
/* -------------------------------------------------------------------------- */

function Screen2({ onPick }: { onPick: (p: ClientType, size: SegmentSize, vol: number) => void }) {
  const t = useTranslations("onboarding");
  const [type, setType] = useState<ClientType>("PRO_AUDITOR");
  const [size, setSize] = useState<SegmentSize>("SOLO");
  const [vol, setVol] = useState<number>(5);

  const types: { v: ClientType; k: string }[] = [
    { v: "PRO_ARTISAN",       k: "proArtisan" },
    { v: "PRO_DIAGNOSTICIAN", k: "proDiagnostician" },
    { v: "PRO_AUDITOR",       k: "proAuditor" },
    { v: "PRO_BUREAU_ETUDES", k: "proBureauEtudes" },
    { v: "PRO_AGENCY",        k: "proAgency" },
    { v: "PRO_SYNDIC",        k: "proSyndic" },
    { v: "PRO_OTHER",         k: "proOther" },
  ];

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-amber-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {t("step2ProTitle")}
      </h1>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {types.map(x => (
          <label key={x.v} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${
            type === x.v ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-amber-300"
          }`}>
            <input type="radio" name="proType" value={x.v} checked={type === x.v} onChange={() => setType(x.v)} className="size-4 text-amber-600" />
            <span className="text-sm font-medium text-stone-800">{t(x.k)}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-stone-700">{t("cabinetSize")}</span>
          <select
            value={size}
            onChange={e => setSize(e.target.value as SegmentSize)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <option value="SOLO">Solo (1)</option>
            <option value="XS">2-5</option>
            <option value="S">6-15</option>
            <option value="M">16-50</option>
            <option value="L">51-200</option>
            <option value="XL">200+</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">{t("monthlyVolume")}</span>
          <input
            type="number"
            min={0}
            max={1000}
            value={vol}
            onChange={e => setVol(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          />
        </label>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onPick(type, size, vol)}
          className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          Suivant →
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Écran 3 — email + magic link                                              */
/* -------------------------------------------------------------------------- */

function Screen3({ email, onSubmit, pending }: { email: string; onSubmit: (e: string) => void; pending: boolean }) {
  const t = useTranslations("auth");
  const [v, setV] = useState(email);
  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {t("signUp")}
      </h1>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="mt-6">
        <label className="block text-sm">
          <span className="font-medium text-stone-700">{t("email")}</span>
          <input
            type="email"
            required
            value={v}
            onChange={e => setV(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            autoComplete="email"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-teal-800 px-6 py-3 text-base font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          {pending ? "…" : t("signUp")}
        </button>
      </form>
      <p className="mt-4 text-xs text-stone-500" dangerouslySetInnerHTML={{ __html: t.markup("termsAccept", {
        terms:   () => `<a href="/legal/cgu"     class="underline">${t("termsLink")}</a>`,
        privacy: () => `<a href="/legal/privacy" class="underline">${t("privacyLink")}</a>`,
      }) }} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Écran 4 — questions adaptées                                              */
/* -------------------------------------------------------------------------- */

function Screen4({ isPro, onPick }: { isPro: boolean; onPick: (g: PrimaryGoal) => void }) {
  const t = useTranslations("onboarding");
  const goals: { v: PrimaryGoal; k: string }[] = isPro
    ? [
        { v: "PRODUCE_AUDITS",          k: "goalEconomy" },     // libellés à étoffer
        { v: "PRODUCE_DPE",             k: "goalDPE" },
        { v: "COMPLY_DECRET_TERTIAIRE", k: "goalAids" },
      ]
    : [
        { v: "REDUCE_BILLS",  k: "goalEconomy" },
        { v: "PLAN_RENO",     k: "goalComfort" },
        { v: "FIND_AIDS",     k: "goalAids" },
        { v: "SELL_BUY_HOUSE",k: "goalDPE" },
      ];

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {t("step4Title")}
      </h1>
      <div className="mt-6 grid gap-3">
        {goals.map(g => (
          <button
            key={g.v}
            onClick={() => onPick(g.v)}
            className="rounded-lg border-2 border-stone-200 px-6 py-4 text-left text-sm font-medium text-stone-800 transition hover:border-teal-500 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            {t(g.k)}
          </button>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Écran 5 — plan suggéré                                                    */
/* -------------------------------------------------------------------------- */

function Screen5({ suggested, onPick, pending }: { suggested: SubscriptionPlan; onPick: (p: SubscriptionPlan) => void; pending: boolean }) {
  const t = useTranslations("billing");
  const PLAN_LABEL: Record<SubscriptionPlan, string> = {
    P_DECOUVERTE: "Découverte (Gratuit)",
    P_MON_PROJET: "Mon projet (19 €)",
    TRIAL: "Essai 14 j (Gratuit)",
    SOLO: "Solo (49 €/mois)",
    PRO: "Pro (149 €/mois)",
    TEAM: "Équipe (449 €/mois)",
    ENTERPRISE: "Entreprise (sur devis)",
  };

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        Plan suggéré
      </h1>
      <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-6">
        <div className="text-xs font-semibold uppercase text-amber-700">Recommandation</div>
        <div className="mt-2 font-serif text-2xl font-bold text-amber-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {PLAN_LABEL[suggested]}
        </div>
        <button
          onClick={() => onPick(suggested)}
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-amber-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          {pending ? "…" : "Accepter et continuer"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-stone-500">
        Vous pourrez changer de plan à tout moment depuis votre compte.
      </p>
    </>
  );
}
