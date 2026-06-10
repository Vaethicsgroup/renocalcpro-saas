// app/[locale]/o/portal/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portail client v2 — Espace de partage et collaboration avec les clients.
// Le pro crée un lien de partage par dossier. Le client accède à un espace
// personnalisé : consulter le rapport, télécharger les documents, valider
// les scénarios, signer électroniquement.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Link2,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Send,
  Copy,
  Trash2,
  FileSignature,
  Calendar,
  Lock,
  MessageSquare,
  Smartphone,
  Mail,
  X,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type ShareStatus = "ACTIVE" | "VIEWED" | "SIGNED" | "EXPIRED" | "REVOKED";
type DeliveryChannel = "EMAIL" | "SMS" | "LINK";

interface SharedDocument {
  id: string;
  name: string;
  category: "RAPPORT" | "DEVIS" | "PHOTOS" | "PLAN" | "ATTESTATION";
  requiresSignature?: boolean;
}

interface ActivityLog {
  ts: string;
  label: string;
}

interface ClientShare {
  id: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  status: ShareStatus;
  documents: ReadonlyArray<SharedDocument>;
  createdAt: string;
  expiresAt?: string;
  lastViewedAt?: string;
  viewCount: number;
  pinProtected?: boolean;
  customMessage?: string;
  channels: ReadonlyArray<DeliveryChannel>;
  activity: ReadonlyArray<ActivityLog>;
}

const STATUS_META: Record<
  ShareStatus,
  { label: string; color: string; Icon: typeof CheckCircle2 }
> = {
  ACTIVE: { label: "En attente d'ouverture", color: "bg-stone-100 text-stone-700", Icon: Clock },
  VIEWED: { label: "Consulté", color: "bg-info-100 text-info-800", Icon: Eye },
  SIGNED: { label: "Signé", color: "bg-forest-100 text-forest-800", Icon: CheckCircle2 },
  EXPIRED: { label: "Expiré", color: "bg-amber-100 text-amber-800", Icon: Clock },
  REVOKED: { label: "Révoqué", color: "bg-red-100 text-red-700", Icon: X },
};

const SAMPLE_SHARES: ClientShare[] = [
  {
    id: "s1",
    projectName: "Maison Martin",
    clientName: "Pierre Martin",
    clientEmail: "pierre.martin@email.fr",
    clientPhone: "06 12 34 56 78",
    status: "SIGNED",
    documents: [
      { id: "d1", name: "Rapport audit énergétique", category: "RAPPORT", requiresSignature: true },
      { id: "d2", name: "Devis travaux global", category: "DEVIS", requiresSignature: true },
      { id: "d3", name: "Photos chantier", category: "PHOTOS" },
    ],
    createdAt: "2026-05-15",
    expiresAt: "2026-08-15",
    lastViewedAt: "2026-06-01",
    viewCount: 7,
    pinProtected: true,
    customMessage: "Bonjour Pierre, voici votre rapport d'audit énergétique avec les scénarios de rénovation. N'hésitez pas à me contacter pour toute question.",
    channels: ["EMAIL", "SMS"],
    activity: [
      { ts: "2026-06-01 14:32", label: "Document signé électroniquement" },
      { ts: "2026-05-28 18:05", label: "Devis téléchargé" },
      { ts: "2026-05-22 09:14", label: "Rapport consulté (5 min)" },
      { ts: "2026-05-15 10:00", label: "Lien partagé par email" },
    ],
  },
  {
    id: "s2",
    projectName: "Appartement Dupont",
    clientName: "Sophie Dupont",
    clientEmail: "s.dupont@gmail.com",
    status: "VIEWED",
    documents: [
      { id: "d4", name: "Rapport préliminaire", category: "RAPPORT" },
      { id: "d5", name: "Plan masse", category: "PLAN" },
    ],
    createdAt: "2026-05-28",
    expiresAt: "2026-07-28",
    lastViewedAt: "2026-06-03",
    viewCount: 2,
    channels: ["EMAIL"],
    activity: [
      { ts: "2026-06-03 11:20", label: "Rapport consulté (2 min)" },
      { ts: "2026-05-28 16:45", label: "Lien partagé par email" },
    ],
  },
  {
    id: "s3",
    projectName: "Maison Bernard",
    clientName: "Marc Bernard",
    clientEmail: "marc.bernard@orange.fr",
    status: "ACTIVE",
    documents: [
      { id: "d6", name: "Devis estimatif", category: "DEVIS", requiresSignature: true },
    ],
    createdAt: "2026-06-02",
    expiresAt: "2026-09-02",
    viewCount: 0,
    pinProtected: true,
    channels: ["EMAIL", "SMS"],
    activity: [
      { ts: "2026-06-02 10:00", label: "Lien partagé par email + SMS" },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════
export default function PortalPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShareStatus | "ALL">("ALL");
  const [openShareId, setOpenShareId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [shares, setShares] = useState<ClientShare[]>(SAMPLE_SHARES);

  const filtered = useMemo(() => {
    let list = [...shares];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (sh) =>
          sh.projectName.toLowerCase().includes(s) ||
          sh.clientName.toLowerCase().includes(s) ||
          sh.clientEmail.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "ALL") {
      list = list.filter((sh) => sh.status === statusFilter);
    }
    return list;
  }, [shares, search, statusFilter]);

  const counts = {
    active: shares.filter((s) => s.status === "ACTIVE").length,
    viewed: shares.filter((s) => s.status === "VIEWED").length,
    signed: shares.filter((s) => s.status === "SIGNED").length,
    expired: shares.filter((s) => s.status === "EXPIRED" || s.status === "REVOKED").length,
  };

  const openShare = shares.find((s) => s.id === openShareId);

  const handleCreate = (draft: Omit<ClientShare, "id" | "activity" | "viewCount" | "status" | "createdAt">) => {
    const id = `s-${Date.now()}`;
    const now = new Date().toISOString().slice(0, 10);
    const newShare: ClientShare = {
      ...draft,
      id,
      status: "ACTIVE",
      viewCount: 0,
      createdAt: now,
      activity: [
        {
          ts: new Date().toISOString().slice(0, 16).replace("T", " "),
          label: `Lien créé et partagé par ${draft.channels.join(" + ")}`,
        },
      ],
    };
    setShares((prev) => [newShare, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Link2 className="h-3 w-3" />
              Portail client
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Partages avec vos clients
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Envoyez rapports, devis et photos à vos clients via un lien
              personnalisé, sécurisé et signé électroniquement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" />
            Nouveau partage
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Partages actifs" value={counts.active + counts.viewed} icon={Activity} color="text-info-700" />
          <Kpi label="Consultés" value={counts.viewed} icon={Eye} color="text-info-700" />
          <Kpi label="Signés" value={counts.signed} icon={CheckCircle2} color="text-forest-700" />
          <Kpi label="Expirés / révoqués" value={counts.expired} icon={Clock} color="text-stone-500" />
        </div>
      </header>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par client, projet ou email…"
                className="h-9 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShareStatus | "ALL")}
              className="h-9 rounded-md border border-cream-300 bg-white px-3 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
            >
              <option value="ALL">Tous statuts</option>
              {(Object.keys(STATUS_META) as ShareStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Filter className="mx-auto h-6 w-6 text-stone-400" />
          <p className="mt-2 text-sm text-stone-600">Aucun partage ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((sh) => (
            <ShareCard key={sh.id} share={sh} onClick={() => setOpenShareId(sh.id)} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateShareDrawer onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      )}

      {openShare && (
        <ShareDetailDrawer
          share={openShare}
          onClose={() => setOpenShareId(null)}
          onRevoke={() => {
            setShares((prev) =>
              prev.map((s) => (s.id === openShare.id ? { ...s, status: "REVOKED" as const } : s)),
            );
            setOpenShareId(null);
          }}
        />
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-cream-200 bg-white p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100">
        <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
        <p className="font-serif text-xl font-bold text-forest-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function ShareCard({ share, onClick }: { share: ClientShare; onClick: () => void }) {
  const meta = STATUS_META[share.status];
  const StatusIcon = meta.Icon;
  const signedDocs = share.documents.filter((d) => d.requiresSignature).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left overflow-hidden rounded-xl border-2 border-cream-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md"
    >
      <div className="border-b border-cream-200 bg-cream-50/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-base font-bold text-forest-900">{share.projectName}</p>
            <p className="text-xs text-stone-600">{share.clientName} · {share.clientEmail}</p>
          </div>
          <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
            <StatusIcon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-cream-200">
        <KpiInline label="Documents" value={`${share.documents.length}`} />
        <KpiInline label="À signer" value={`${signedDocs}`} highlight={signedDocs > 0} />
        <KpiInline label="Vues" value={`${share.viewCount}`} />
      </div>

      <div className="flex items-center justify-between bg-white px-4 py-2 text-[11px] text-stone-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Partagé le {new Date(share.createdAt).toLocaleDateString("fr-FR")}
        </span>
        <span className="flex items-center gap-2">
          {share.pinProtected && (
            <span className="flex items-center gap-0.5 text-stone-600">
              <Lock className="h-2.5 w-2.5" /> PIN
            </span>
          )}
          {share.channels.map((c) => (
            <span key={c}>
              {c === "EMAIL" && <Mail className="h-3 w-3" />}
              {c === "SMS" && <Smartphone className="h-3 w-3" />}
              {c === "LINK" && <Link2 className="h-3 w-3" />}
            </span>
          ))}
          <ChevronRight className="h-3 w-3 text-stone-400" />
        </span>
      </div>
    </button>
  );
}

function KpiInline({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white p-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${highlight ? "text-forest-700" : "text-forest-900"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Drawer création ─────────────────────────────────────────────────────

function CreateShareDrawer({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (draft: Omit<ClientShare, "id" | "activity" | "viewCount" | "status" | "createdAt">) => void;
}) {
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [docs, setDocs] = useState<SharedDocument[]>([
    { id: "d-rep", name: "Rapport audit énergétique", category: "RAPPORT", requiresSignature: false },
  ]);
  const [expirationDays, setExpirationDays] = useState(60);
  const [pinProtected, setPinProtected] = useState(true);
  const [channels, setChannels] = useState<DeliveryChannel[]>(["EMAIL"]);
  const [customMessage, setCustomMessage] = useState("");

  const toggleChannel = (c: DeliveryChannel) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addDoc = () => {
    setDocs((prev) => [
      ...prev,
      { id: `d-${Date.now()}`, name: "Nouveau document", category: "RAPPORT" },
    ]);
  };

  const updateDoc = (id: string, patch: Partial<SharedDocument>) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  const canSubmit = projectName && clientName && clientEmail && docs.length > 0 && channels.length > 0;

  const submit = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    onCreate({
      projectName,
      clientName,
      clientEmail,
      clientPhone: clientPhone || undefined,
      documents: docs,
      expiresAt: expiresAt.toISOString().slice(0, 10),
      pinProtected,
      customMessage: customMessage || undefined,
      channels,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-night-900/40 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Nouveau partage</p>
            <h2 className="font-serif text-xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              Créer un lien client
            </h2>
            <Stepper step={step} steps={["Client", "Documents", "Paramètres"]} />
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-1 text-stone-500 hover:bg-cream-100 hover:text-stone-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Nom du projet" required value={projectName} onChange={setProjectName} placeholder="Maison des Tilleuls" />
              <Field label="Nom du client" required value={clientName} onChange={setClientName} placeholder="Pierre Martin" />
              <Field label="Email du client" required type="email" value={clientEmail} onChange={setClientEmail} placeholder="pierre.martin@email.fr" />
              <Field label="Téléphone (pour SMS)" type="tel" value={clientPhone} onChange={setClientPhone} placeholder="06 12 34 56 78" helper="Optionnel — utilisé si vous activez la notification SMS." />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-stone-700">
                Sélectionnez les documents à partager. Cochez ceux qui nécessitent une signature électronique.
              </p>
              {docs.map((d) => (
                <div key={d.id} className="rounded-lg border border-cream-300 bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDoc(d.id, { name: e.target.value })}
                        className="rounded border border-cream-300 px-2 py-1 text-sm focus:border-forest-500 focus:outline-none"
                      />
                      <select
                        value={d.category}
                        onChange={(e) => updateDoc(d.id, { category: e.target.value as SharedDocument["category"] })}
                        className="rounded border border-cream-300 px-2 py-1 text-sm focus:border-forest-500 focus:outline-none"
                      >
                        <option value="RAPPORT">Rapport</option>
                        <option value="DEVIS">Devis</option>
                        <option value="PHOTOS">Photos</option>
                        <option value="PLAN">Plan</option>
                        <option value="ATTESTATION">Attestation</option>
                      </select>
                    </div>
                    <button type="button" onClick={() => removeDoc(d.id)} className="rounded-md p-1 text-stone-500 hover:bg-red-50 hover:text-red-700" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={d.requiresSignature ?? false}
                      onChange={(e) => updateDoc(d.id, { requiresSignature: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-forest-600"
                    />
                    <FileSignature className="h-3 w-3 text-forest-700" />
                    Signature électronique requise (eIDAS)
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={addDoc}
                className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:border-forest-300 hover:bg-cream-50"
              >
                <Plus className="h-3 w-3" />
                Ajouter un document
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-forest-900">Expiration du lien</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[15, 30, 60, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExpirationDays(d)}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        expirationDays === d ? "bg-forest-700 text-white" : "border border-cream-300 bg-white text-stone-700 hover:border-forest-300",
                      ].join(" ")}
                    >
                      {d} jours
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-md border border-cream-300 bg-white p-3 text-sm">
                <input type="checkbox" checked={pinProtected} onChange={(e) => setPinProtected(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-forest-600" />
                <span>
                  <span className="block font-semibold text-forest-900">
                    <Lock className="mr-1 inline h-3 w-3" />
                    Protéger par un code PIN à 4 chiffres
                  </span>
                  <span className="text-xs text-stone-600">
                    Recommandé pour les devis et documents confidentiels. Le PIN est envoyé séparément par SMS.
                  </span>
                </span>
              </label>

              <div>
                <label className="text-sm font-semibold text-forest-900">Canaux d&apos;envoi</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([{ v: "EMAIL" as const, label: "Email", Icon: Mail }, { v: "SMS" as const, label: "SMS", Icon: Smartphone }, { v: "LINK" as const, label: "Lien copiable", Icon: Link2 }]).map(({ v, label, Icon }) => {
                    const active = channels.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleChannel(v)}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                          active ? "border-forest-500 bg-forest-50 text-forest-800" : "border-cream-300 bg-white text-stone-700 hover:border-forest-300",
                        ].join(" ")}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-forest-900">
                  Message personnalisé <span className="text-xs font-normal text-stone-500">(optionnel)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Bonjour Pierre, voici votre rapport d'audit. N'hésitez pas à me solliciter pour toute question…"
                  className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-cream-200 bg-cream-50 px-5 py-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-semibold text-stone-600 hover:text-forest-700">
              ← Précédent
            </button>
          ) : <span />}
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && (!projectName || !clientName || !clientEmail)) || (step === 1 && docs.length === 0)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm disabled:bg-stone-300"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
            >
              <Send className="h-4 w-4" />
              Envoyer au client
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Stepper({ step, steps }: { step: number; steps: ReadonlyArray<string> }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-600">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className={["grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold", i < step ? "bg-forest-700 text-white" : i === step ? "bg-forest-600 text-white" : "bg-cream-300 text-stone-500"].join(" ")}>
            {i + 1}
          </span>
          <span className={i === step ? "font-bold text-forest-900" : ""}>{s}</span>
          {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-stone-400" />}
        </span>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
      />
      {helper && <span className="mt-0.5 block text-[11px] text-stone-500">{helper}</span>}
    </label>
  );
}

// ─── Drawer détail ────────────────────────────────────────────────────────

function ShareDetailDrawer({
  share,
  onClose,
  onRevoke,
}: {
  share: ClientShare;
  onClose: () => void;
  onRevoke: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = STATUS_META[share.status];
  const StatusIcon = meta.Icon;
  const shareLink = `https://renocalcpro.fr/portal/${share.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-night-900/40 p-2 sm:p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex h-full max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                <StatusIcon className="h-2.5 w-2.5" />
                {meta.label}
              </span>
            </div>
            <h2 className="mt-1 font-serif text-xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {share.projectName}
            </h2>
            <p className="text-xs text-stone-600">
              {share.clientName} · {share.clientEmail}
              {share.clientPhone && ` · ${share.clientPhone}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-1 text-stone-500 hover:bg-cream-100 hover:text-stone-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-5">
          <div className="rounded-lg border border-forest-200 bg-forest-50/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">Lien de partage</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded border border-cream-300 bg-white px-2 py-1 font-mono text-[11px] text-stone-700">{shareLink}</code>
              <button type="button" onClick={copyLink} className="inline-flex h-8 items-center gap-1 rounded-md border border-forest-300 bg-white px-2 text-xs font-semibold text-forest-700 hover:bg-forest-50">
                <Copy className="h-3 w-3" />
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
            {share.pinProtected && (
              <p className="mt-2 text-[11px] text-stone-600">
                <Lock className="mr-1 inline h-3 w-3" />
                Code PIN actif. Envoyé séparément par SMS au client.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Documents partagés ({share.documents.length})</p>
            <ul className="mt-2 space-y-1.5">
              {share.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-cream-200 bg-white px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">{d.category}</span>
                    <span className="truncate font-medium text-forest-900">{d.name}</span>
                  </span>
                  {d.requiresSignature && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
                      <FileSignature className="h-2.5 w-2.5" />
                      Signature
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {share.customMessage && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Message envoyé au client</p>
              <p className="mt-1 rounded-md border border-cream-200 bg-cream-50/40 p-3 text-sm italic text-stone-700">
                <MessageSquare className="mr-2 inline h-3.5 w-3.5 text-stone-500" />
                {share.customMessage}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Activité ({share.activity.length} événements)</p>
            <ul className="mt-2 space-y-1.5">
              {share.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
                  <span className="font-mono text-[10px] text-stone-500">{a.ts}</span>
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-cream-200 bg-cream-50/40 p-3 text-[11px]">
            <span>
              <strong className="text-forest-900">Créé le</strong>
              <br />
              {new Date(share.createdAt).toLocaleDateString("fr-FR")}
            </span>
            {share.expiresAt && (
              <span>
                <strong className="text-forest-900">Expire le</strong>
                <br />
                {new Date(share.expiresAt).toLocaleDateString("fr-FR")}
              </span>
            )}
            <span>
              <strong className="text-forest-900">Canaux</strong>
              <br />
              {share.channels.join(", ")}
            </span>
            <span>
              <strong className="text-forest-900">Vues totales</strong>
              <br />
              {share.viewCount} fois
            </span>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-cream-200 bg-cream-50 px-5 py-3">
          <button type="button" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-forest-700">
            <RefreshCw className="h-3 w-3" />
            Relancer le client
          </button>
          {share.status !== "REVOKED" && (
            <button type="button" onClick={onRevoke} className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
              <ShieldCheck className="h-3 w-3" />
              Révoquer l&apos;accès
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
