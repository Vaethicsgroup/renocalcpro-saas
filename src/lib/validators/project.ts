// src/lib/validators/project.ts
// Schemas Zod — validation stricte de tout input passant un boundary réseau.
// Toute server action / route handler doit faire passer ses inputs par ces schemas.

import { z } from "zod";

const cuid = z.string().regex(/^c[a-z0-9]{24,}$/, "ID invalide");

export const ProjectKindSchema = z.enum([
  "AUDIT_PARTICULIER",
  "DPE_COLLECTIF",
  "AUDIT_COPROPRIETE",
  "AUDIT_TERTIAIRE",
]);

export const ProjectStatusSchema = z.enum([
  "DRAFT", "IN_PROGRESS", "REPORT_READY", "DELIVERED", "ARCHIVED",
]);

// ─── Création projet ──────────────────────────────────────────────────────
export const CreateProjectSchema = z.object({
  reference: z.string().min(3).max(64).regex(/^[A-Z0-9-]+$/, "Référence : majuscules, chiffres et tirets uniquement"),
  name: z.string().min(2).max(200),
  kind: ProjectKindSchema,
  clientName: z.string().max(200).optional(),
  clientEmail: z.string().email().max(254).optional().or(z.literal("")),
  clientPhone: z.string().max(32).optional(),
  clientNotes: z.string().max(5000).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ─── Bâtiment ─────────────────────────────────────────────────────────────
export const BuildingSchema = z.object({
  addressLine: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  postalCode: z.string().regex(/^[0-9A-Z]{3,10}$/),
  country: z.string().length(2).default("FR"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  altitudeM: z.number().int().min(-500).max(5000).optional(),
  climateZone: z.enum(["H1a","H1b","H1c","H2a","H2b","H2c","H2d","H3"]).optional(),
  djuBase18: z.number().int().min(500).max(5000).optional(),
  facadeAzimuth: z.number().int().min(0).max(359).optional(),
  yearBuilt: z.number().int().min(1700).max(new Date().getFullYear()).optional(),
  surfaceM2: z.number().min(5).max(50000),
  ceilingHeightM: z.number().min(1.5).max(8).default(2.5),
  occupants: z.number().int().min(0).max(10000).default(1),
  levels: z.number().int().min(1).max(50).default(1),
  groundType: z.enum([
    "VIDE_SANITAIRE", "TERRE_PLEIN", "CAVE", "SOUS_SOL",
    "LOCAL_NON_CHAUFFE", "APPARTEMENT_SUR_CHAUFFE", "AUTRE",
  ]).optional(),
  floorStructure: z.enum([
    "DALLE_BETON", "HOURDIS_POUTRELLES", "BOIS_SOLIVAGE", "MIXTE", "AUTRE",
  ]).optional(),
});
export type BuildingInput = z.infer<typeof BuildingSchema>;

// ─── Photo (upload) ───────────────────────────────────────────────────────
export const PhotoUploadSchema = z.object({
  projectId: cuid,
  filename: z.string().min(1).max(255),
  bytes: z.number().int().min(1).max(10 * 1024 * 1024), // 10 Mo max
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  category: z.enum([
    "FACADE_PRINCIPALE", "FACADE_ARRIERE", "FACADE_PIGNON",
    "TOITURE", "COMBLES", "PLANCHER_BAS", "VIDE_SANITAIRE",
    "MENUISERIES", "CHAUFFAGE", "ECS", "VMC",
    "PANNEAUX_SOLAIRES", "TABLEAU_ELECTRIQUE",
    "PATHOLOGIE", "DEFAUT", "CONTRAINTE", "AUTRE",
  ]).default("AUTRE"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const PhotoUpdateSchema = z.object({
  id: cuid,
  category: z.enum([
    "FACADE_PRINCIPALE", "FACADE_ARRIERE", "FACADE_PIGNON",
    "TOITURE", "COMBLES", "PLANCHER_BAS", "VIDE_SANITAIRE",
    "MENUISERIES", "CHAUFFAGE", "ECS", "VMC",
    "PANNEAUX_SOLAIRES", "TABLEAU_ELECTRIQUE",
    "PATHOLOGIE", "DEFAUT", "CONTRAINTE", "AUTRE",
  ]).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  showInReport: z.boolean().optional(),
  importance: z.number().int().min(1).max(5).optional(),
  displayOrder: z.number().int().min(0).max(99999).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

// ─── Rapport (génération) ─────────────────────────────────────────────────
export const GenerateReportSchema = z.object({
  projectId: cuid,
  templateKind: ProjectKindSchema,
  level: z.enum(["SYNTHESE", "COMPLET", "EXPERT"]).default("COMPLET"),
  language: z.enum(["fr", "en", "es", "de", "pt"]).default("fr"),
  watermark: z.string().max(50).optional(),
});

// ─── Membre / invitation ──────────────────────────────────────────────────
export const InviteMemberSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["OWNER", "ADMIN", "AUDITOR", "VIEWER", "CLIENT_PORTAL"]),
});
