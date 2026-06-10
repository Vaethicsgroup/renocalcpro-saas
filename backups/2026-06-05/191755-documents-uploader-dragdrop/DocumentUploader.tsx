// src/components/documents/DocumentUploader.tsx
// ════════════════════════════════════════════════════════════════════════════
// Composant d'upload de documents : drag-drop zone, file picker, multi-fichiers,
// sélection de catégorie, association à un projet, prévisualisation image,
// persistance localStorage (MVP) en attendant un endpoint S3/Cloudinary.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  FileType2,
  Receipt,
  ShieldCheck,
  Camera,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export type DocumentCategory =
  | "RAPPORT"
  | "DEVIS"
  | "ATTESTATION"
  | "PHOTO"
  | "FACTURE"
  | "PLAN"
  | "AUTRE";

export const CATEGORY_LABELS_FR: Record<DocumentCategory, string> = {
  RAPPORT: "Rapport",
  DEVIS: "Devis",
  ATTESTATION: "Attestation",
  PHOTO: "Photo",
  FACTURE: "Facture",
  PLAN: "Plan",
  AUTRE: "Autre",
};

const CATEGORY_ICONS: Record<DocumentCategory, typeof FileText> = {
  RAPPORT: ClipboardList,
  DEVIS: Receipt,
  ATTESTATION: ShieldCheck,
  PHOTO: Camera,
  FACTURE: Receipt,
  PLAN: FileType2,
  AUTRE: FileText,
};

export interface UploadedDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  projectId?: string;
  /** Format de fichier (déduit de l'extension). */
  format: string;
  /** Taille en octets. */
  sizeBytes: number;
  /** Date ISO d'upload. */
  uploadedAt: string;
  /** Data URL (base64) pour preview/download — MVP localStorage. */
  dataUrl?: string;
  /** Statut d'upload : pending / uploading / success / error. */
  status: "pending" | "uploading" | "success" | "error";
  /** Progression 0-100. */
  progress: number;
  /** Message d'erreur si status === error. */
  errorMessage?: string;
}

interface Props {
  /** Liste des projets disponibles pour l'association. */
  availableProjects?: ReadonlyArray<{ id: string; name: string }>;
  /** Catégorie pré-sélectionnée par défaut. */
  defaultCategory?: DocumentCategory;
  /** Callback à la fin d'un upload réussi. */
  onUploadComplete?: (doc: UploadedDocument) => void;
  /** Limite par défaut (10 Mo). */
  maxFileSizeMb?: number;
  /** Types MIME acceptés (par défaut PDF + images + Office). */
  acceptedMimeTypes?: ReadonlyArray<string>;
}

const DEFAULT_ACCEPTED: ReadonlyArray<string> = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
];

export function DocumentUploader({
  availableProjects = [],
  defaultCategory = "AUTRE",
  onUploadComplete,
  maxFileSizeMb = 10,
  acceptedMimeTypes = DEFAULT_ACCEPTED,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<UploadedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Drag & drop handlers ───
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const guessCategory = useCallback(
    (filename: string): DocumentCategory => {
      const name = filename.toLowerCase();
      if (name.includes("plan") || name.includes("cadastr")) return "PLAN";
      if (name.includes("devis")) return "DEVIS";
      if (name.includes("facture") || name.includes("avoir")) return "FACTURE";
      if (
        name.includes("attestation") ||
        name.includes("rge") ||
        name.includes("qualif")
      )
        return "ATTESTATION";
      if (name.includes("rapport") || name.includes("audit")) return "RAPPORT";
      if (
        /\.(jpe?g|png|webp|heic)$/.test(name) ||
        name.includes("photo") ||
        name.includes("img")
      )
        return "PHOTO";
      return defaultCategory;
    },
    [defaultCategory],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      for (const file of arr) {
        // Validations
        if (acceptedMimeTypes.length > 0 && !acceptedMimeTypes.includes(file.type)) {
          const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setPendingDocs((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              category: defaultCategory,
              format: file.name.split(".").pop()?.toUpperCase() ?? "?",
              sizeBytes: file.size,
              uploadedAt: new Date().toISOString(),
              status: "error",
              progress: 0,
              errorMessage: `Format non supporté (${file.type || "inconnu"}).`,
            },
          ]);
          continue;
        }
        if (file.size > maxFileSizeMb * 1024 * 1024) {
          const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setPendingDocs((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              category: defaultCategory,
              format: file.name.split(".").pop()?.toUpperCase() ?? "?",
              sizeBytes: file.size,
              uploadedAt: new Date().toISOString(),
              status: "error",
              progress: 0,
              errorMessage: `Fichier trop volumineux (max ${maxFileSizeMb} Mo).`,
            },
          ]);
          continue;
        }

        // OK - upload simulé via FileReader (data URL → localStorage)
        const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const initial: UploadedDocument = {
          id,
          name: file.name,
          category: guessCategory(file.name),
          format: file.name.split(".").pop()?.toUpperCase() ?? "?",
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          status: "uploading",
          progress: 0,
        };
        setPendingDocs((prev) => [...prev, initial]);

        // Simulation de progression
        const reader = new FileReader();
        reader.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setPendingDocs((prev) =>
              prev.map((d) => (d.id === id ? { ...d, progress: pct } : d)),
            );
          }
        };
        reader.onload = () => {
          const dataUrl =
            typeof reader.result === "string" ? reader.result : undefined;
          const final: UploadedDocument = {
            ...initial,
            dataUrl,
            status: "success",
            progress: 100,
          };
          setPendingDocs((prev) =>
            prev.map((d) => (d.id === id ? final : d)),
          );
          // Persistance localStorage (clé documents-uploaded)
          try {
            const raw = localStorage.getItem("renocalc.documents");
            const existing: UploadedDocument[] = raw ? JSON.parse(raw) : [];
            localStorage.setItem(
              "renocalc.documents",
              JSON.stringify([...existing, final]),
            );
          } catch {
            // localStorage saturé : on garde quand même en mémoire
          }
          onUploadComplete?.(final);
        };
        reader.onerror = () => {
          setPendingDocs((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    status: "error",
                    errorMessage: "Lecture du fichier impossible.",
                  }
                : d,
            ),
          );
        };
        reader.readAsDataURL(file);
      }
    },
    [
      acceptedMimeTypes,
      maxFileSizeMb,
      defaultCategory,
      guessCategory,
      onUploadComplete,
    ],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles],
  );

  const updateDoc = (id: string, patch: Partial<UploadedDocument>) => {
    setPendingDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...patch };
        // Mettre à jour localStorage aussi pour les docs déjà sauvés
        if (updated.status === "success") {
          try {
            const raw = localStorage.getItem("renocalc.documents");
            const list: UploadedDocument[] = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex((x) => x.id === id);
            if (idx >= 0) {
              list[idx] = updated;
              localStorage.setItem("renocalc.documents", JSON.stringify(list));
            }
          } catch {
            /* ignore */
          }
        }
        return updated;
      }),
    );
  };

  const removeDoc = (id: string) => {
    setPendingDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      const raw = localStorage.getItem("renocalc.documents");
      const list: UploadedDocument[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        "renocalc.documents",
        JSON.stringify(list.filter((d) => d.id !== id)),
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-forest-500 bg-forest-50"
            : "border-cream-400 bg-cream-50/40 hover:border-forest-300 hover:bg-cream-50",
        ].join(" ")}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-forest-100 text-forest-700">
          <Upload className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="mt-3 font-serif text-lg font-bold text-forest-900">
          Glissez vos documents ici
        </p>
        <p className="mt-1 text-sm text-stone-600">
          ou cliquez pour sélectionner depuis votre appareil
        </p>
        <p className="mt-2 text-[11px] text-stone-500">
          PDF, images (JPG/PNG/WEBP), Word, Excel — max {maxFileSizeMb} Mo par
          fichier
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedMimeTypes.join(",")}
          onChange={onFileInput}
          className="hidden"
          aria-label="Sélection de fichiers"
        />
      </div>

      {/* Liste des fichiers en cours / uploadés */}
      {pendingDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {pendingDocs.length} document{pendingDocs.length > 1 ? "s" : ""} —
            ajout en cours
          </p>
          {pendingDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              availableProjects={availableProjects}
              onUpdate={updateDoc}
              onRemove={removeDoc}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  availableProjects,
  onUpdate,
  onRemove,
}: {
  doc: UploadedDocument;
  availableProjects: ReadonlyArray<{ id: string; name: string }>;
  onUpdate: (id: string, patch: Partial<UploadedDocument>) => void;
  onRemove: (id: string) => void;
}) {
  const CatIcon = CATEGORY_ICONS[doc.category];
  const isImage = doc.format.toLowerCase().match(/^(jpe?g|png|webp|heic)$/);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div
      className={[
        "rounded-xl border p-3",
        doc.status === "error"
          ? "border-red-300 bg-red-50/40"
          : doc.status === "success"
            ? "border-forest-200 bg-white"
            : "border-cream-300 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100">
          {isImage && doc.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.dataUrl}
              alt={doc.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <CatIcon className="h-5 w-5 text-stone-600" />
          )}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <input
              type="text"
              value={doc.name}
              onChange={(e) => onUpdate(doc.id, { name: e.target.value })}
              disabled={doc.status === "uploading"}
              className="min-w-0 flex-1 truncate border-none bg-transparent text-sm font-semibold text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-400"
            />
            <button
              type="button"
              onClick={() => onRemove(doc.id)}
              aria-label="Supprimer"
              className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 font-semibold text-stone-700">
              {doc.format}
            </span>
            <span>{formatSize(doc.sizeBytes)}</span>
            <span>·</span>
            <span>
              {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
            </span>
          </div>

          {/* Sélecteurs métadonnées */}
          {doc.status !== "error" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-600">
                  Catégorie :
                </span>
                <select
                  value={doc.category}
                  onChange={(e) =>
                    onUpdate(doc.id, {
                      category: e.target.value as DocumentCategory,
                    })
                  }
                  disabled={doc.status === "uploading"}
                  className="rounded border border-cream-300 bg-white px-1.5 py-0.5 text-xs focus:border-forest-500 focus:outline-none"
                >
                  {(Object.keys(CATEGORY_LABELS_FR) as DocumentCategory[]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS_FR[c]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              {availableProjects.length > 0 && (
                <label className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-stone-600">
                    Projet :
                  </span>
                  <select
                    value={doc.projectId ?? ""}
                    onChange={(e) =>
                      onUpdate(doc.id, {
                        projectId: e.target.value || undefined,
                      })
                    }
                    disabled={doc.status === "uploading"}
                    className="rounded border border-cream-300 bg-white px-1.5 py-0.5 text-xs focus:border-forest-500 focus:outline-none"
                  >
                    <option value="">— Non associé —</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* Statut */}
          {doc.status === "uploading" && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full bg-forest-600 transition-all"
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-stone-500">
                Téléversement… {doc.progress} %
              </p>
            </div>
          )}
          {doc.status === "success" && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700">
              <CheckCircle2 className="h-3 w-3" />
              Importé avec succès
            </p>
          )}
          {doc.status === "error" && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              {doc.errorMessage ?? "Échec de l'upload"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helper : charger les documents persistés depuis localStorage
// ────────────────────────────────────────────────────────────────────────────

export function loadPersistedDocuments(): UploadedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("renocalc.documents");
    return raw ? (JSON.parse(raw) as UploadedDocument[]) : [];
  } catch {
    return [];
  }
}

export function removePersistedDocument(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("renocalc.documents");
    const list: UploadedDocument[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      "renocalc.documents",
      JSON.stringify(list.filter((d) => d.id !== id)),
    );
  } catch {
    /* ignore */
  }
}
