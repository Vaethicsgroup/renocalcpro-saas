// src/components/o/ProClientForm.tsx
// ════════════════════════════════════════════════════════════════════════════
// Formulaire client côté professionnel : coordonnées + adresse du bien +
// statut de propriété (propriétaire occupant, bailleur, SCI, indivision...).
// Carte d'éligibilité aux aides affichée en temps réel selon le statut.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import {
  ownershipEligibility,
  OWNERSHIP_LABELS_FR,
  type OwnershipKind,
} from "@/lib/calc/catalog/ownership";

export interface ProClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Adresse complète du bien (rue + ville). */
  propertyAddress: string;
  propertyPostalCode: string;
  propertyCity: string;
  /** Statut de propriété. */
  ownershipKind: OwnershipKind;
  /** Nom SCI / personne morale si applicable. */
  legalEntityName?: string;
  /** SIRET si personne morale. */
  siret?: string;
  /** Notes internes pro. */
  internalNotes?: string;
}

interface Props {
  /** Valeur initiale du client (édition d'un dossier existant). */
  defaultValue?: Partial<ProClient>;
  onSubmit?: (client: ProClient) => void;
}

const EMPTY: ProClient = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  propertyAddress: "",
  propertyPostalCode: "",
  propertyCity: "",
  ownershipKind: "PROPRIETAIRE_OCCUPANT",
};

export function ProClientForm({ defaultValue, onSubmit }: Props) {
  const [client, setClient] = useState<ProClient>({
    ...EMPTY,
    ...defaultValue,
  });

  const update = <K extends keyof ProClient>(key: K, value: ProClient[K]) =>
    setClient((prev) => ({ ...prev, [key]: value }));

  const eligibility = useMemo(
    () => ownershipEligibility(client.ownershipKind),
    [client.ownershipKind],
  );

  const isLegalEntity =
    client.ownershipKind === "SCI_FAMILIALE_IR" ||
    client.ownershipKind === "SCI_PATRIMONIALE_IS" ||
    client.ownershipKind === "SYNDIC_COPRO" ||
    client.ownershipKind === "PERSONNE_MORALE_ENTREPRISE" ||
    client.ownershipKind === "BAILLEUR_SOCIAL";

  return (
    <div className="space-y-5">
      {/* ─── Coordonnées client ─── */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                Coordonnées du client
              </p>
              <p className="text-xs text-stone-600">
                Données personnelles obligatoires pour le dossier d'audit et
                les démarches administratives (MPR, CEE, Éco-PTZ).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Prénom" htmlFor="firstName" required>
              <Input
                id="firstName"
                value={client.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Marie"
              />
            </FormField>
            <FormField label="Nom" htmlFor="lastName" required>
              <Input
                id="lastName"
                value={client.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Dupont"
              />
            </FormField>
            <FormField label="Email" htmlFor="email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="email"
                  type="email"
                  value={client.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="marie.dupont@email.fr"
                  className="pl-9"
                />
              </div>
            </FormField>
            <FormField label="Téléphone" htmlFor="phone" required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={client.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="pl-9"
                />
              </div>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ─── Adresse du bien ─── */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                Adresse du bien à diagnostiquer
              </p>
              <p className="text-xs text-stone-600">
                Adresse complète du logement concerné par l'audit (peut être
                différente de la résidence du client).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Adresse"
              htmlFor="propertyAddress"
              required
              className="sm:col-span-3"
            >
              <Input
                id="propertyAddress"
                value={client.propertyAddress}
                onChange={(e) => update("propertyAddress", e.target.value)}
                placeholder="12 rue des Vignes"
              />
            </FormField>
            <FormField label="Code postal" htmlFor="propertyPostalCode" required>
              <Input
                id="propertyPostalCode"
                value={client.propertyPostalCode}
                onChange={(e) => update("propertyPostalCode", e.target.value)}
                placeholder="33000"
                maxLength={5}
              />
            </FormField>
            <FormField
              label="Ville"
              htmlFor="propertyCity"
              required
              className="sm:col-span-2"
            >
              <Input
                id="propertyCity"
                value={client.propertyCity}
                onChange={(e) => update("propertyCity", e.target.value)}
                placeholder="Bordeaux"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ─── Statut de propriété ─── */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracotta-100 text-terracotta-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                Statut de propriété
              </p>
              <p className="text-xs text-stone-600">
                Détermine l'éligibilité à MaPrimeRénov', l'Éco-PTZ et les autres
                aides selon le régime fiscal du maître d'ouvrage.
              </p>
            </div>
          </div>

          <FormField label="Statut" htmlFor="ownershipKind" required>
            <Select
              id="ownershipKind"
              value={client.ownershipKind}
              onChange={(e) =>
                update("ownershipKind", e.target.value as OwnershipKind)
              }
            >
              {(Object.keys(OWNERSHIP_LABELS_FR) as OwnershipKind[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {OWNERSHIP_LABELS_FR[k]}
                  </option>
                ),
              )}
            </Select>
          </FormField>

          {isLegalEntity && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                label="Raison sociale / nom SCI"
                htmlFor="legalEntityName"
              >
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="legalEntityName"
                    value={client.legalEntityName ?? ""}
                    onChange={(e) => update("legalEntityName", e.target.value)}
                    placeholder="SCI Famille Dupont"
                    className="pl-9"
                  />
                </div>
              </FormField>
              <FormField label="SIRET" htmlFor="siret">
                <Input
                  id="siret"
                  value={client.siret ?? ""}
                  onChange={(e) => update("siret", e.target.value)}
                  placeholder="123 456 789 00012"
                  maxLength={17}
                />
              </FormField>
            </div>
          )}

          {/* ─── Carte d'éligibilité réactive ─── */}
          <EligibilityCard
            ownershipKind={client.ownershipKind}
            eligibility={eligibility}
          />
        </CardContent>
      </Card>

      {/* ─── Notes pro ─── */}
      <Card>
        <CardContent>
          <FormField label="Notes internes (auditeur)" htmlFor="internalNotes">
            <textarea
              id="internalNotes"
              value={client.internalNotes ?? ""}
              onChange={(e) => update("internalNotes", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              placeholder="Particularités du dossier, rendez-vous prévus, contraintes spécifiques…"
            />
          </FormField>
        </CardContent>
      </Card>

      {onSubmit && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onSubmit(client)}
            disabled={
              !client.firstName ||
              !client.lastName ||
              !client.email ||
              !client.propertyAddress
            }
          >
            Enregistrer le dossier
          </Button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function EligibilityCard({
  ownershipKind: _kind,
  eligibility,
}: {
  ownershipKind: OwnershipKind;
  eligibility: ReturnType<typeof ownershipEligibility>;
}) {
  const rows: Array<{ label: string; eligible: boolean }> = [
    { label: "MaPrimeRénov' (forfait par geste)", eligible: eligibility.mprEligible },
    {
      label: "MPR Parcours Accompagné (rénovation globale)",
      eligible: eligibility.mprAccompagneEligible,
    },
    {
      label: "MPR Copropriété (parties communes)",
      eligible: eligibility.mprCoproEligible,
    },
    { label: "Éco-PTZ (prêt à taux zéro)", eligible: eligibility.ecoPtzEligible },
    { label: "Éco-PLS (HLM)", eligible: eligibility.ecoPlsEligible },
    {
      label: "CEE Coup de pouce",
      eligible: eligibility.ceeEligible,
    },
    { label: "TVA 5,5 %", eligible: eligibility.tva5_5Eligible },
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-forest-200 bg-forest-50/40">
      <div className="bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white">
        Éligibilité aux aides selon ce statut
      </div>
      <div className="grid grid-cols-1 gap-px bg-forest-200 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-2 bg-white px-3 py-2 text-sm"
          >
            {r.eligible ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-forest-600" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-stone-400" />
            )}
            <span
              className={r.eligible ? "text-forest-900" : "text-stone-500"}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>

      {eligibility.decretTertiaireApplicable && (
        <div className="border-t border-forest-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
          <strong>Décret tertiaire applicable</strong> — déclaration annuelle
          OPERAT obligatoire si surface tertiaire ≥ 1000 m².
        </div>
      )}

      {eligibility.notesFr.length > 0 && (
        <div className="border-t border-forest-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Points clés à vérifier
          </p>
          <ul className="mt-2 space-y-1 text-xs text-stone-700">
            {eligibility.notesFr.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-500" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {eligibility.adminStepsFr.length > 0 && (
        <div className="border-t border-forest-200 bg-cream-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-night-700">
            <FileText className="h-3 w-3" />
            Étapes administratives spécifiques
          </p>
          <ol className="mt-2 space-y-1 text-xs text-stone-700">
            {eligibility.adminStepsFr.map((s, i) => (
              <li key={s} className="flex items-start gap-2">
                <span className="font-bold text-night-700">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
