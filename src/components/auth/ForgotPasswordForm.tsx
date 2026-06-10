"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Réutilise l'endpoint magic-link existant
    await fetch("/api/auth/signin/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, callbackUrl: `/${locale}` }),
    }).catch(() => undefined);
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center">
        <p className="text-3xl">📬</p>
        <h3 className="mt-3 font-serif text-xl font-bold text-success-800">{t("sentTitle")}</h3>
        <p className="mt-2 text-sm text-success-700" dangerouslySetInnerHTML={{ __html: t("sentBody", { email }) }} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label={t("emailLabel")} htmlFor="email" required>
        <Input id="email" type="email" required autoComplete="email" placeholder={t("emailPh")} value={email} onChange={e => setEmail(e.target.value)} />
      </FormField>
      <Button type="submit" loading={submitting} fullWidth size="lg">{submitting ? t("sending") : t("btnSubmit")}</Button>
    </form>
  );
}
