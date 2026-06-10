// app/[locale]/o/projects/[id]/identite/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet Identité du dossier projet pro — refonte v2.2 :
//   - Coordonnées client structurées (prénom/nom/email/téléphone)
//   - Adresse complète du bien diagnostiqué
//   - Statut de propriété (occupant / bailleur / SCI / indivision / copro)
//   - Carte d'éligibilité aux aides réactive selon le statut
//   - Workflow d'audit (documents, étapes, niveau de confiance)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProClientForm, type ProClient } from "@/components/o/ProClientForm";
import { AuditWorkflow } from "@/components/o/AuditWorkflow";
import { Card, CardContent } from "@/components/ui/Card";
import { Building2, ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateProjectIdentity } from "@/server/actions/projectIdentity";

export default function IdentitePage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";

  const [client, setClient] = useState<Partial<ProClient>>({
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@email.fr",
    phone: "06 12 34 56 78",
    propertyAddress: "12 rue des Vignes",
    propertyPostalCode: "33000",
    propertyCity: "Bordeaux",
    ownershipKind: "PROPRIETAIRE_OCCUPANT",
  });
  const [activeTab, setActiveTab] = useState<"client" | "audit">("client");
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const handleSubmit = async (c: ProClient) => {
    setClient(c);
    setSaveState({ status: "saving" });
    try {
      // organizationId : à récupérer depuis le contexte d'auth. Pour la démo,
      // utiliser un placeholder. À remplacer par le vrai ID depuis useSession.
      const res = await updateProjectIdentity({
        projectId,
        organizationId: "current-org-placeholder",
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        propertyAddress: c.propertyAddress,
        propertyPostalCode: c.propertyPostalCode,
        propertyCity: c.propertyCity,
        ownershipKind: c.ownershipKind,
        legalEntityName: c.legalEntityName,
        siret: c.siret,
        internalNotes: c.internalNotes,
      });
      if (res.ok)
        setSaveState({ status: "success", message: res.message });
      else setSaveState({ status: "error", message: res.message });
    } catch (err) {
      setSaveState({
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  };

  // Année construction approximative (à remplacer par valeur stockée du dossier).
  const constructionYear = 1972;

  // Déduction des flags contextuels pour AuditWorkflow
  const isLegalEntity =
    client.ownershipKind === "SCI_FAMILIALE_IR" ||
    client.ownershipKind === "SCI_PATRIMONIALE_IS" ||
    client.ownershipKind === "PERSONNE_MORALE_ENTREPRISE" ||
    client.ownershipKind === "SYNDIC_COPRO" ||
    client.ownershipKind === "BAILLEUR_SOCIAL";
  const isCopropriete = client.ownershipKind === "SYNDIC_COPRO";
  const isIndivision = client.ownershipKind === "INDIVISION";

  return (
    <div className="space-y-6">
      {/* En-tête contextuel */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
                Dossier · {client.lastName?.toUpperCase()}{" "}
                {client.firstName?.toUpperCase()}
              </p>
              <h2
                className="font-serif text-2xl font-bold text-forest-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                Identité & workflow audit
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Renseignez les coordonnées du client, vérifiez son éligibilité
                aux aides selon le statut de propriété, et suivez la check-list
                documents + étapes du processus d'audit énergétique.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-300">
        <button
          type="button"
          onClick={() => setActiveTab("client")}
          className={[
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "client"
              ? "border-b-2 border-forest-700 text-forest-900"
              : "text-stone-500 hover:text-forest-700",
          ].join(" ")}
        >
          <Building2 className="h-4 w-4" />
          Client & propriété
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={[
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "audit"
              ? "border-b-2 border-forest-700 text-forest-900"
              : "text-stone-500 hover:text-forest-700",
          ].join(" ")}
        >
          <ClipboardCheck className="h-4 w-4" />
          Workflow audit
        </button>
      </div>

      {activeTab === "client" && (
        <>
          {saveState.status === "success" && (
            <div className="flex items-start gap-2 rounded-lg border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              {saveState.message}
            </div>
          )}
          {saveState.status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              {saveState.message}
            </div>
          )}
          <ProClientForm
            defaultValue={client}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {activeTab === "audit" && (
        <AuditWorkflow
          constructionYear={constructionYear}
          isLegalEntity={isLegalEntity}
          isCopropriete={isCopropriete}
          isIndivision={isIndivision}
        />
      )}
    </div>
  );
}
