// app/[locale]/o/settings/page.tsx — Paramètres pro v2
"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Plug,
  Shield,
  Palette,
  Download,
  Trash2,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Key,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type SectionKey =
  | "account"
  | "security"
  | "notifications"
  | "integrations"
  | "appearance"
  | "data_privacy";

const SECTIONS: ReadonlyArray<{
  key: SectionKey;
  label: string;
  icon: typeof User;
  description: string;
}> = [
  { key: "account", label: "Compte", icon: User, description: "Profil, email, mot de passe" },
  { key: "security", label: "Sécurité", icon: Lock, description: "2FA, sessions, clés API" },
  { key: "notifications", label: "Notifications", icon: Bell, description: "Email, SMS, in-app" },
  { key: "integrations", label: "Intégrations", icon: Plug, description: "Stripe, GraphQL, webhooks" },
  { key: "appearance", label: "Apparence", icon: Palette, description: "Thème, langue, fuseau" },
  { key: "data_privacy", label: "Données & RGPD", icon: Shield, description: "Export, suppression" },
];

export default function SettingsPage() {
  const [active, setActive] = useState<SectionKey>("account");

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <SettingsIcon className="h-3 w-3" />
          Paramètres
        </p>
        <h1
          className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Configuration de votre espace
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Tout ce qui concerne votre compte personnel et les réglages techniques.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent className="p-2">
            <nav>
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = active === s.key;
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        onClick={() => setActive(s.key)}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isActive
                            ? "bg-forest-50 text-forest-900"
                            : "text-stone-700 hover:bg-cream-50",
                        ].join(" ")}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            isActive ? "bg-forest-700 text-white" : "bg-cream-100 text-stone-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm font-semibold ${isActive ? "text-forest-900" : ""}`}>
                            {s.label}
                          </span>
                          <span className="block truncate text-[11px] text-stone-500">
                            {s.description}
                          </span>
                        </span>
                        <ChevronRight className={`ml-auto h-3 w-3 shrink-0 ${isActive ? "text-forest-700" : "text-stone-400"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {active === "account" && <AccountSection />}
          {active === "security" && <SecuritySection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "integrations" && <IntegrationsSection />}
          {active === "appearance" && <AppearanceSection />}
          {active === "data_privacy" && <DataPrivacySection />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof User; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-forest-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
    </div>
  );
}

function AccountSection() {
  const [firstName, setFirstName] = useState("Jean");
  const [lastName, setLastName] = useState("Dupont");
  const [email, setEmail] = useState("jean.dupont@cabinet-dupont.fr");
  const [phone, setPhone] = useState("06 12 34 56 78");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={User} title="Compte personnel" subtitle="Informations affichées sur les rapports et emails." />
        {saved && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-forest-50 px-3 py-2 text-sm text-forest-900">
            <CheckCircle2 className="h-4 w-4 text-forest-700" />
            Modifications enregistrées.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" value={firstName} onChange={setFirstName} />
          <Field label="Nom" value={lastName} onChange={setLastName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Téléphone" type="tel" value={phone} onChange={setPhone} />
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-forest-900">Mot de passe</p>
          <button type="button" className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 text-xs font-semibold text-forest-700 hover:bg-cream-50">
            <Key className="h-3 w-3" />
            Modifier le mot de passe
          </button>
        </div>
        <div className="mt-4 flex items-center justify-end border-t border-cream-200 pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-forest-700 px-4 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const [twoFA, setTwoFA] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "rcp_live_sk_••••••••••••••••••••••3a7f";

  const copy = () => {
    navigator.clipboard.writeText("rcp_live_sk_abc123_jamais_montre_3a7f");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Lock} title="Authentification & sécurité" subtitle="Renforcez l'accès à votre compte." />
          <label className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white p-3">
            <input
              type="checkbox"
              checked={twoFA}
              onChange={(e) => setTwoFA(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-forest-600"
            />
            <span>
              <span className="block text-sm font-semibold text-forest-900">Authentification à double facteur (2FA)</span>
              <span className="text-xs text-stone-600">Code temporaire généré par une appli (Google Authenticator, Authy) à chaque connexion.</span>
            </span>
          </label>
          {twoFA && (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              Configuration requise : scannez le QR code dans votre app, puis entrez le code à 6 chiffres pour activer.
              <button type="button" className="ml-2 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-700">
                Configurer maintenant
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Activity} title="Sessions actives" subtitle="Appareils connectés à votre compte." />
          <ul className="space-y-2">
            {[
              { device: "MacBook Pro · Safari", location: "Paris, France", lastActive: "maintenant", current: true },
              { device: "iPhone 15 · App Réno·Calc", location: "Paris, France", lastActive: "il y a 2 h" },
            ].map((s) => (
              <li key={s.device} className="flex items-center justify-between rounded-lg border border-cream-200 bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-forest-900">
                    {s.device}
                    {s.current && (
                      <span className="ml-2 rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-800">Session actuelle</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">{s.location} · {s.lastActive}</p>
                </div>
                {!s.current && (
                  <button type="button" className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50">
                    Déconnecter
                  </button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Key} title="Clé API personnelle" subtitle="Pour utiliser l'API REST/GraphQL depuis vos outils." />
          <div className="flex items-center gap-2 rounded-md border border-cream-200 bg-cream-50 p-2">
            <code className="flex-1 truncate font-mono text-xs text-stone-700">
              {showKey ? "rcp_live_sk_abc123_jamais_montre_3a7f" : apiKey}
            </code>
            <button type="button" onClick={() => setShowKey(!showKey)} className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-600 hover:bg-cream-100" aria-label="Voir/masquer">
              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-forest-300 bg-white px-2 py-1 text-[11px] font-semibold text-forest-700 hover:bg-forest-50">
              <Copy className="h-3 w-3" />
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Cette clé donne accès à vos données. Ne la partagez jamais. En cas de fuite, régénérez-la immédiatement.
          </p>
          <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50">
            Régénérer la clé
          </button>
        </CardContent>
      </Card>
    </>
  );
}

function NotificationsSection() {
  const [emailPrefs, setEmailPrefs] = useState({ new_project: true, client_view: true, client_signed: true, weekly_digest: false, product_news: false });
  const [smsPrefs, setSmsPrefs] = useState({ urgent_only: true, aids_status: false });
  const [inappPrefs, setInappPrefs] = useState({ all: true, soundEnabled: true });

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Mail} title="Notifications par email" subtitle="Quand vous prévenir par mail ?" />
          <ToggleRow label="Nouveau projet créé" description="Quand un client commence un audit dans votre espace" checked={emailPrefs.new_project} onChange={(v) => setEmailPrefs((p) => ({ ...p, new_project: v }))} />
          <ToggleRow label="Client a consulté un partage" description="Notification dès qu'un client ouvre un lien envoyé" checked={emailPrefs.client_view} onChange={(v) => setEmailPrefs((p) => ({ ...p, client_view: v }))} />
          <ToggleRow label="Document signé" description="Quand un client signe électroniquement un document" checked={emailPrefs.client_signed} onChange={(v) => setEmailPrefs((p) => ({ ...p, client_signed: v }))} />
          <ToggleRow label="Récap hebdomadaire" description="Tous les lundis matin : vos KPIs de la semaine" checked={emailPrefs.weekly_digest} onChange={(v) => setEmailPrefs((p) => ({ ...p, weekly_digest: v }))} />
          <ToggleRow label="Actualités produit" description="Nouvelles fonctionnalités, mises à jour" checked={emailPrefs.product_news} onChange={(v) => setEmailPrefs((p) => ({ ...p, product_news: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Smartphone} title="Notifications SMS" subtitle="Coût facturé au tarif standard de votre opérateur." />
          <ToggleRow label="Urgences uniquement" description="Tentative de connexion suspecte, échec de paiement" checked={smsPrefs.urgent_only} onChange={(v) => setSmsPrefs((p) => ({ ...p, urgent_only: v }))} />
          <ToggleRow label="Statut des aides" description="Quand le statut d'une demande change" checked={smsPrefs.aids_status} onChange={(v) => setSmsPrefs((p) => ({ ...p, aids_status: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Bell} title="Notifications dans l'app" subtitle="Cloche en haut à droite de l'interface." />
          <ToggleRow label="Toutes les notifications" description="Désactiver pour ne plus rien afficher" checked={inappPrefs.all} onChange={(v) => setInappPrefs((p) => ({ ...p, all: v }))} />
          <ToggleRow label="Son activé" description="Bip discret à chaque notification" checked={inappPrefs.soundEnabled} onChange={(v) => setInappPrefs((p) => ({ ...p, soundEnabled: v }))} />
        </CardContent>
      </Card>
    </>
  );
}

function IntegrationsSection() {
  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={Plug} title="Intégrations & connecteurs" subtitle="Connectez Réno·Calc à vos outils existants." />
        <ul className="space-y-3">
          {[
            { name: "Stripe", description: "Encaissement carte bancaire, prélèvements SEPA", status: "Connecté", color: "bg-forest-100 text-forest-800" },
            { name: "Resend", description: "Envoi d'emails transactionnels (rapports, factures)", status: "Connecté", color: "bg-forest-100 text-forest-800" },
            { name: "Twilio", description: "Notifications SMS aux clients (signature, suivi)", status: "Non configuré", color: "bg-stone-100 text-stone-700" },
            { name: "Brevo (Sendinblue)", description: "CRM marketing et campagnes", status: "Non configuré", color: "bg-stone-100 text-stone-700" },
            { name: "API GraphQL", description: "Accès programmatique à vos données", status: "Actif", color: "bg-info-100 text-info-800" },
            { name: "Webhooks", description: "Recevoir des événements vers votre serveur", status: "2 webhooks actifs", color: "bg-forest-100 text-forest-800" },
            { name: "Zapier", description: "Automatiser entre Réno·Calc et 5000+ apps", status: "Bientôt", color: "bg-amber-100 text-amber-800" },
          ].map((i) => (
            <li key={i.name} className="flex items-center justify-between rounded-lg border border-cream-200 bg-white p-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest-900">{i.name}</p>
                <p className="text-xs text-stone-600">{i.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i.color}`}>{i.status}</span>
                <button type="button" className="rounded-md border border-cream-300 bg-white px-2 py-1 text-[11px] font-semibold text-forest-700 hover:bg-forest-50">
                  Configurer
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [language, setLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={Palette} title="Apparence & régionalisation" subtitle="Personnalisez l'interface selon vos préférences." />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-forest-900">Thème</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([{ v: "light" as const, label: "Clair", Icon: Sun }, { v: "dark" as const, label: "Sombre", Icon: Moon }, { v: "auto" as const, label: "Auto", Icon: SettingsIcon }]).map(({ v, label, Icon }) => {
                const active = theme === v;
                return (
                  <button key={v} type="button" onClick={() => setTheme(v)} className={["flex items-center justify-center gap-1.5 rounded-lg border-2 p-3 text-sm font-semibold transition-colors", active ? "border-forest-500 bg-forest-50 text-forest-900" : "border-cream-300 bg-white text-stone-700 hover:border-forest-200"].join(" ")}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Langue" value={language} onChange={setLanguage} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }, { value: "es", label: "Español" }, { value: "de", label: "Deutsch" }, { value: "pt", label: "Português" }]} icon={Globe} />
            <Select label="Fuseau horaire" value={timezone} onChange={setTimezone} options={[{ value: "Europe/Paris", label: "Paris (UTC+1)" }, { value: "Europe/London", label: "Londres (UTC)" }, { value: "America/New_York", label: "New York (UTC-5)" }]} />
            <Select label="Format date" value={dateFormat} onChange={setDateFormat} options={[{ value: "DD/MM/YYYY", label: "31/12/2026" }, { value: "YYYY-MM-DD", label: "2026-12-31" }, { value: "MM/DD/YYYY", label: "12/31/2026" }]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataPrivacySection() {
  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Download} title="Export de vos données" subtitle="Conforme RGPD (art. 20 — portabilité)." />
          <p className="text-sm text-stone-700">
            Téléchargez l&apos;ensemble de vos données au format JSON (projets, clients, rapports, factures, paramètres). L&apos;export est prêt sous 48 h et vous est envoyé par email.
          </p>
          <button type="button" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-md bg-forest-600 px-3 text-sm font-semibold text-white hover:bg-forest-800">
            <Download className="h-4 w-4" />
            Demander un export
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Shield} title="Conservation des données" subtitle="Durée de stockage et anonymisation." />
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />Dossiers actifs : conservés tant que votre compte est actif</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />Factures : 10 ans (obligation légale)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />Logs de connexion : 1 an</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />Documents clients : 5 ans après clôture du dossier</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
            <SectionTitle icon={Trash2} title="Supprimer mon compte" subtitle="Action irréversible — toutes vos données seront effacées." />
            <p className="text-sm text-stone-700">
              La suppression entraîne l&apos;effacement définitif sous 30 jours de vos projets, clients, rapports, et préférences. Les données soumises à conservation légale (factures) sont conservées anonymisées.
            </p>
            <button type="button" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Supprimer définitivement mon compte
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none" />
    </label>
  );
}

function Select({ label, value, onChange, options, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; options: ReadonlyArray<{ value: string; label: string }>; icon?: typeof Globe }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">{label}</span>
      <div className="relative mt-1">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-md border border-cream-300 ${Icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm focus:border-forest-500 focus:outline-none`}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 border-b border-cream-100 py-3 last:border-b-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-forest-600" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-forest-900">{label}</span>
        <span className="block text-xs text-stone-600">{description}</span>
      </span>
    </label>
  );
}
