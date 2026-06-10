// tests/professional-compliance.test.ts
// Tests unitaires sur la lib de conformité professionnelle.
// Pas de DB, pas de localStorage — pures functions.

import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_MATRIX,
  canEmbedProfessionalIdentityInReport,
  canUseExpertMode,
  evaluateProfessionalCompliance,
  fromLegacyProfile,
  getComplianceFieldDefs,
  getRequiredComplianceFields,
  type ProfessionalProfile,
} from "@/lib/compliance/professional-compliance";

function emptyData() {
  return { fields: {} };
}

/**
 * Construit des `fields` valides pour TOUS les champs requis d'un profil.
 * Permet d'amener facilement un profil à l'état "complet".
 */
function fullyValidData(profile: ProfessionalProfile) {
  const fields: Record<string, unknown> = {};
  for (const def of COMPLIANCE_MATRIX[profile]) {
    if (!def.required) continue;
    switch (def.type) {
      case "text":     fields[def.key] = `valeur-${def.key}`; break;
      case "siret":    fields[def.key] = "12345678901234"; break;
      case "date":     fields[def.key] = "2099-01-01"; break;
      case "checkbox": fields[def.key] = true; break;
      case "select":   fields[def.key] = "option"; break;
      case "file":     fields[def.key] = "fichier.pdf"; break;
    }
  }
  return { fields };
}

describe("getRequiredComplianceFields", () => {
  it("retourne les bonnes clés requises pour diagnostiqueur", () => {
    const keys = getRequiredComplianceFields("diagnostiqueur");
    expect(keys).toEqual(
      expect.arrayContaining([
        "companyName",
        "siret",
        "insuranceRcPro",
        "certifyingBody",
        "certificationNumber",
        "certifiedScopes",
        "certificationExpiry",
        "honorDeclaration",
      ]),
    );
    expect(keys).not.toContain("supportingDocument");
  });

  it("retourne uniquement company, siret et honor pour pro_general", () => {
    const keys = getRequiredComplianceFields("pro_general");
    expect(keys).toEqual(expect.arrayContaining(["companyName", "honorDeclaration"]));
    expect(keys).not.toContain("siret"); // siret est optionnel pour pro_general
  });
});

describe("evaluateProfessionalCompliance", () => {
  const profiles: ProfessionalProfile[] = [
    "diagnostiqueur",
    "auditeur",
    "bureau_etudes",
    "syndic",
    "agence",
    "pro_general",
  ];

  it("profil incomplet → INCOMPLETE + missingFields non vide + gates fermés", () => {
    for (const profile of profiles) {
      const ev = evaluateProfessionalCompliance(profile, emptyData());
      expect(ev.status).toBe("INCOMPLETE");
      expect(ev.isComplete).toBe(false);
      expect(ev.missingFields.length).toBeGreaterThan(0);
      expect(ev.canUseExpertMode).toBe(false);
      expect(ev.canEmbedProfessionalIdentityInReport).toBe(false);
    }
  });

  it("données valides → DECLARED + gates ouverts", () => {
    for (const profile of profiles) {
      const ev = evaluateProfessionalCompliance(profile, fullyValidData(profile));
      expect(ev.status).toBe("DECLARED");
      expect(ev.isComplete).toBe(true);
      expect(ev.missingFields).toEqual([]);
      expect(ev.canUseExpertMode).toBe(true);
      expect(ev.canEmbedProfessionalIdentityInReport).toBe(true);
      // On reste "non vérifié" tant que back-office n'a pas reviewé
      expect(ev.reportShouldDiscloseUnverified).toBe(true);
    }
  });

  it("SIRET invalide → INCOMPLETE pour diagnostiqueur", () => {
    const data = fullyValidData("diagnostiqueur");
    data.fields.siret = "abc";
    const ev = evaluateProfessionalCompliance("diagnostiqueur", data);
    expect(ev.status).toBe("INCOMPLETE");
    expect(ev.missingFields).toContain("siret");
  });

  it("honorDeclaration non cochée → INCOMPLETE", () => {
    const data = fullyValidData("auditeur");
    data.fields.honorDeclaration = false;
    const ev = evaluateProfessionalCompliance("auditeur", data);
    expect(ev.status).toBe("INCOMPLETE");
    expect(ev.missingFields).toContain("honorDeclaration");
  });

  it("expiresAt passée → EXPIRED même si fields complets", () => {
    const ev = evaluateProfessionalCompliance("diagnostiqueur", {
      ...fullyValidData("diagnostiqueur"),
      expiresAt: "2000-01-01",
    });
    expect(ev.status).toBe("EXPIRED");
    expect(ev.canUseExpertMode).toBe(false);
    expect(ev.canEmbedProfessionalIdentityInReport).toBe(false);
  });

  it("reviewedStatus VERIFIED → VERIFIED + reportShouldDiscloseUnverified=false", () => {
    const ev = evaluateProfessionalCompliance("auditeur", {
      ...fullyValidData("auditeur"),
      reviewedStatus: "VERIFIED",
    });
    expect(ev.status).toBe("VERIFIED");
    expect(ev.reportShouldDiscloseUnverified).toBe(false);
    expect(ev.canEmbedProfessionalIdentityInReport).toBe(true);
  });

  it("reviewedStatus REJECTED → REJECTED + gates fermés", () => {
    const ev = evaluateProfessionalCompliance("syndic", {
      ...fullyValidData("syndic"),
      reviewedStatus: "REJECTED",
    });
    expect(ev.status).toBe("REJECTED");
    expect(ev.canUseExpertMode).toBe(false);
    expect(ev.canEmbedProfessionalIdentityInReport).toBe(false);
  });

  it("reviewedStatus PENDING_REVIEW → PENDING_REVIEW + gates ouverts (déclaration suffisante)", () => {
    const ev = evaluateProfessionalCompliance("agence", {
      ...fullyValidData("agence"),
      reviewedStatus: "PENDING_REVIEW",
    });
    expect(ev.status).toBe("PENDING_REVIEW");
    expect(ev.canUseExpertMode).toBe(true);
    expect(ev.canEmbedProfessionalIdentityInReport).toBe(true);
  });

  it("expiration prévaut sur reviewedStatus VERIFIED", () => {
    const ev = evaluateProfessionalCompliance("diagnostiqueur", {
      ...fullyValidData("diagnostiqueur"),
      reviewedStatus: "VERIFIED",
      expiresAt: "2000-01-01",
    });
    expect(ev.status).toBe("EXPIRED");
  });

  it("fail-closed sur data null", () => {
    const ev = evaluateProfessionalCompliance("auditeur", null);
    expect(ev.status).toBe("INCOMPLETE");
    expect(ev.canUseExpertMode).toBe(false);
    expect(ev.canEmbedProfessionalIdentityInReport).toBe(false);
  });
});

describe("gates helpers", () => {
  it("canUseExpertMode incomplet=false / complet=true", () => {
    expect(canUseExpertMode("diagnostiqueur", emptyData())).toBe(false);
    expect(canUseExpertMode("diagnostiqueur", fullyValidData("diagnostiqueur"))).toBe(true);
  });

  it("canEmbedProfessionalIdentityInReport incomplet=false / complet=true", () => {
    expect(canEmbedProfessionalIdentityInReport("syndic", emptyData())).toBe(false);
    expect(canEmbedProfessionalIdentityInReport("syndic", fullyValidData("syndic"))).toBe(true);
  });
});

describe("fromLegacyProfile", () => {
  it("mappe les profils legacy vers la convention compliance", () => {
    expect(fromLegacyProfile("DIAGNOSTIQUEUR")).toBe("diagnostiqueur");
    expect(fromLegacyProfile("AUDITEUR_ENERGETIQUE")).toBe("auditeur");
    expect(fromLegacyProfile("BUREAU_ETUDES_THERMIQUE")).toBe("bureau_etudes");
    expect(fromLegacyProfile("SYNDIC")).toBe("syndic");
    expect(fromLegacyProfile("AGENCE_IMMOBILIERE")).toBe("agence");
    expect(fromLegacyProfile("PRO_GENERAL")).toBe("pro_general");
    expect(fromLegacyProfile("UNKNOWN")).toBe("pro_general");
  });
});

describe("getComplianceFieldDefs", () => {
  it("retourne la définition complète des champs avec types et required", () => {
    const defs = getComplianceFieldDefs("diagnostiqueur");
    expect(defs.length).toBeGreaterThan(0);
    const siret = defs.find((d) => d.key === "siret");
    expect(siret?.type).toBe("siret");
    expect(siret?.required).toBe(true);
  });
});
