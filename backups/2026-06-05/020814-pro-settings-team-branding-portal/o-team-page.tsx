// app/[locale]/o/team/page.tsx — Équipe & accès v2
"use client";

import { useState } from "react";
import {
  Users, Plus, Mail, Send, Shield, Crown, Edit3, Eye, X,
  ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle,
  MoreVertical, Trash2, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type Role = "OWNER" | "ADMIN" | "AUDITOR" | "COMMERCIAL" | "VIEWER";
type ModuleKey = "projects" | "clients" | "reports" | "billing" | "team" | "branding" | "library" | "portal";
type Permission = "NONE" | "READ" | "WRITE" | "ADMIN";

interface Member {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: Role;
  lastActivity: string;
  permissions: Record<ModuleKey, Permission>;
  isOwner?: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  sentAt: string;
  expiresAt: string;
}

const ROLE_META: Record<Role, { label: string; color: string; Icon: typeof Crown; description: string }> = {
  OWNER: { label: "Gérant", color: "bg-terracotta-100 text-terracotta-800", Icon: Crown, description: "Accès total + facturation" },
  ADMIN: { label: "Administrateur", color: "bg-info-100 text-info-800", Icon: Shield, description: "Accès complet sauf facturation" },
  AUDITOR: { label: "Auditeur", color: "bg-forest-100 text-forest-800", Icon: Edit3, description: "Création/modification dossiers" },
  COMMERCIAL: { label: "Commercial", color: "bg-amber-100 text-amber-800", Icon: Users, description: "Clients + portail + lecture" },
  VIEWER: { label: "Lecteur", color: "bg-stone-100 text-stone-700", Icon: Eye, description: "Lecture seule" },
};

const MODULES: ReadonlyArray<{ key: ModuleKey; label: string }> = [
  { key: "projects", label: "Dossiers" },
  { key: "clients", label: "Clients" },
  { key: "reports", label: "Rapports" },
  { key: "portal", label: "Portail client" },
  { key: "library", label: "Bibliothèque" },
  { key: "branding", label: "Marque & entreprise" },
  { key: "team", label: "Équipe & accès" },
  { key: "billing", label: "Facturation" },
];

const PERMISSION_LABELS: Record<Permission, string> = { NONE: "Aucun accès", READ: "Lecture", WRITE: "Lecture + édition", ADMIN: "Administration" };
const PERMISSION_COLORS: Record<Permission, string> = { NONE: "bg-stone-100 text-stone-600", READ: "bg-info-100 text-info-800", WRITE: "bg-forest-100 text-forest-800", ADMIN: "bg-terracotta-100 text-terracotta-800" };

const defaultPermsByRole: Record<Role, Record<ModuleKey, Permission>> = {
  OWNER: { projects: "ADMIN", clients: "ADMIN", reports: "ADMIN", portal: "ADMIN", library: "ADMIN", branding: "ADMIN", team: "ADMIN", billing: "ADMIN" },
  ADMIN: { projects: "ADMIN", clients: "ADMIN", reports: "ADMIN", portal: "ADMIN", library: "ADMIN", branding: "WRITE", team: "WRITE", billing: "READ" },
  AUDITOR: { projects: "WRITE", clients: "WRITE", reports: "WRITE", portal: "WRITE", library: "READ", branding: "NONE", team: "NONE", billing: "NONE" },
  COMMERCIAL: { projects: "READ", clients: "ADMIN", reports: "READ", portal: "WRITE", library: "NONE", branding: "NONE", team: "NONE", billing: "NONE" },
  VIEWER: { projects: "READ", clients: "READ", reports: "READ", portal: "READ", library: "READ", branding: "NONE", team: "NONE", billing: "NONE" },
};

const INITIAL_MEMBERS: Member[] = [
  { id: "m1", initials: "JD", name: "Jean Dupont", email: "jean@cabinet-dupont.fr", role: "OWNER", lastActivity: "il y a 5 min", permissions: defaultPermsByRole.OWNER, isOwner: true },
  { id: "m2", initials: "ML", name: "Marie Leroy", email: "marie@cabinet-dupont.fr", role: "AUDITOR", lastActivity: "il y a 1 h", permissions: defaultPermsByRole.AUDITOR },
  { id: "m3", initials: "TR", name: "Thomas Roux", email: "thomas@cabinet-dupont.fr", role: "COMMERCIAL", lastActivity: "hier", permissions: defaultPermsByRole.COMMERCIAL },
];

const INITIAL_INVITES: PendingInvite[] = [
  { id: "inv1", email: "newhire@cabinet-dupont.fr", role: "VIEWER", sentAt: "il y a 2 j", expiresAt: "dans 5 j" },
];

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [pending, setPending] = useState<PendingInvite[]>(INITIAL_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const updateMemberPerm = (memberId: string, module: ModuleKey, perm: Permission) =>
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, permissions: { ...m.permissions, [module]: perm } } : m)));

  const updateMemberRole = (memberId: string, role: Role) =>
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role, permissions: defaultPermsByRole[role] } : m)));

  const removeMember = (memberId: string) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const removeInvite = (inviteId: string) => setPending((prev) => prev.filter((i) => i.id !== inviteId));

  const sendInvite = (email: string, role: Role) => {
    setPending((prev) => [...prev, { id: `inv-${Date.now()}`, email, role, sentAt: "à l'instant", expiresAt: "dans 7 j" }]);
    setInviteOpen(false);
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Users className="h-3 w-3" />
              Équipe & accès
            </p>
            <h1 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              Membres de votre cabinet
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {members.length} membre{members.length > 1 ? "s" : ""} actif{members.length > 1 ? "s" : ""}
              {pending.length > 0 && ` · ${pending.length} invitation${pending.length > 1 ? "s" : ""} en attente`}
            </p>
          </div>
          <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800">
            <Plus className="h-4 w-4" />
            Inviter un membre
          </button>
        </div>
      </header>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-600">Les 5 rôles disponibles</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(ROLE_META) as Role[]).map((r) => {
              const meta = ROLE_META[r];
              const Icon = meta.Icon;
              return (
                <div key={r} className="flex items-start gap-2 rounded-lg border border-cream-200 bg-white p-2.5">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-forest-900">{meta.label}</p>
                    <p className="text-[10px] text-stone-600 leading-tight">{meta.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-serif text-lg font-bold text-forest-900">Membres actifs ({members.length})</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isExpanded={expandedMemberId === m.id}
              onToggle={() => setExpandedMemberId(expandedMemberId === m.id ? null : m.id)}
              onUpdateRole={(role) => updateMemberRole(m.id, role)}
              onUpdatePerm={(module, perm) => updateMemberPerm(m.id, module, perm)}
              onRemove={() => removeMember(m.id)}
            />
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-bold text-forest-900">Invitations en attente ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((inv) => {
              const meta = ROLE_META[inv.role];
              const Icon = meta.Icon;
              return (
                <Card key={inv.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500">
                          <Mail className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-forest-900">{inv.email}</p>
                          <p className="text-[11px] text-stone-500">Envoyée {inv.sentAt} · expire {inv.expiresAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                        <button type="button" className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-700 hover:bg-cream-50" aria-label="Renvoyer">
                          <RefreshCw className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => removeInvite(inv.id)} className="rounded-md border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50" aria-label="Annuler">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {inviteOpen && <InviteDrawer onClose={() => setInviteOpen(false)} onSend={sendInvite} />}
    </div>
  );
}

function MemberCard({
  member, isExpanded, onToggle, onUpdateRole, onUpdatePerm, onRemove,
}: {
  member: Member;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateRole: (role: Role) => void;
  onUpdatePerm: (module: ModuleKey, perm: Permission) => void;
  onRemove: () => void;
}) {
  const meta = ROLE_META[member.role];
  const Icon = meta.Icon;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 text-sm font-bold text-white">
              {member.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-forest-900">
                {member.name}
                {member.isOwner && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[10px] font-bold text-terracotta-800">
                    <Crown className="h-2.5 w-2.5" />
                    Gérant
                  </span>
                )}
              </p>
              <p className="text-[11px] text-stone-500">{member.email} · {member.lastActivity}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
              <Icon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
            <button type="button" onClick={onToggle} className="rounded-md p-1.5 text-stone-500 hover:bg-cream-50" aria-label="Permissions">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {!member.isOwner && (
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-md p-1.5 text-stone-500 hover:bg-cream-50" aria-label="Actions">
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-cream-300 bg-white shadow-lg">
                    <button type="button" onClick={() => { setMenuOpen(false); onRemove(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                      Retirer du cabinet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-cream-200 pt-3">
            {!member.isOwner && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-600">Rôle</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {(Object.keys(ROLE_META) as Role[]).filter((r) => r !== "OWNER").map((r) => {
                    const rMeta = ROLE_META[r];
                    const RIcon = rMeta.Icon;
                    const active = member.role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onUpdateRole(r)}
                        className={["flex items-center gap-1.5 rounded-md border-2 px-2 py-1.5 text-xs font-semibold transition-colors", active ? "border-forest-500 bg-forest-50 text-forest-900" : "border-cream-300 bg-white text-stone-700 hover:border-forest-300"].join(" ")}
                      >
                        <RIcon className="h-3 w-3" />
                        {rMeta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Permissions par module</p>
                {!member.isOwner && (
                  <button type="button" onClick={() => MODULES.forEach((m) => onUpdatePerm(m.key, defaultPermsByRole[member.role][m.key]))} className="text-[11px] font-semibold text-forest-700 hover:text-forest-900">
                    Réinitialiser au rôle
                  </button>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-cream-200">
                <table className="w-full text-xs">
                  <tbody>
                    {MODULES.map((mod) => (
                      <tr key={mod.key} className="border-b border-cream-100 last:border-b-0">
                        <td className="px-3 py-2 font-semibold text-forest-900">{mod.label}</td>
                        <td className="px-3 py-2">
                          {member.isOwner ? (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${PERMISSION_COLORS.ADMIN}`}>{PERMISSION_LABELS.ADMIN}</span>
                          ) : (
                            <select
                              value={member.permissions[mod.key]}
                              onChange={(e) => onUpdatePerm(mod.key, e.target.value as Permission)}
                              className="rounded border border-cream-300 bg-white px-2 py-0.5 text-[11px] focus:border-forest-500 focus:outline-none"
                            >
                              {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                                <option key={p} value={p}>{PERMISSION_LABELS[p]}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!member.isOwner && (
              <div className="rounded-md border border-info-200 bg-info-50/40 p-2 text-[11px] text-info-900">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                Seul le <strong>gérant</strong> peut modifier les permissions des autres membres et accéder à la facturation.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InviteDrawer({ onClose, onSend }: { onClose: () => void; onSend: (email: string, role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("AUDITOR");
  const [message, setMessage] = useState("");
  const canSend = email.includes("@");

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-end bg-night-900/40 p-2 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-full max-h-[96vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Nouvelle invitation</p>
            <h2 className="font-serif text-xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>Inviter un membre</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-1 text-stone-500 hover:bg-cream-100 hover:text-stone-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-5">
          <label className="block text-sm">
            <span className="font-semibold text-forest-900">Email du futur membre <span className="text-red-600">*</span></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@email.fr" className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none" />
          </label>

          <div>
            <p className="text-sm font-semibold text-forest-900">Rôle attribué</p>
            <div className="mt-2 space-y-2">
              {(Object.keys(ROLE_META) as Role[]).filter((r) => r !== "OWNER").map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta.Icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={["flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors", active ? "border-forest-500 bg-forest-50" : "border-cream-300 bg-white hover:border-forest-300"].join(" ")}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-forest-900">{meta.label}</span>
                      <span className="block text-xs text-stone-600">{meta.description}</span>
                    </span>
                    {active && <CheckCircle2 className="ml-auto h-4 w-4 text-forest-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-semibold text-forest-900">Message personnalisé <span className="text-xs font-normal text-stone-500">(optionnel)</span></span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Bonjour Marie, je t'invite à rejoindre notre cabinet sur Réno·Calc…" className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none" />
          </label>

          <div className="rounded-md border border-info-200 bg-info-50/40 p-3 text-xs text-info-900">
            <Clock className="mr-1 inline h-3 w-3" />
            L&apos;invitation est valable 7 jours. Le membre recevra un email avec un lien de validation et créera son propre mot de passe.
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-cream-200 bg-cream-50 px-5 py-3">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-stone-600 hover:text-forest-700">Annuler</button>
          <button type="button" onClick={() => onSend(email, role)} disabled={!canSend} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300">
            <Send className="h-4 w-4" />
            Envoyer l&apos;invitation
          </button>
        </footer>
      </div>
    </div>
  );
}
