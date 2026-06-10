// src/lib/storage/index.ts
// Sélecteur de driver. Le code applicatif importe `storage` de cet index.

import type { StorageDriver } from "./types";
import { s3Driver } from "./s3Driver";
import { localFsDriver } from "./localFsDriver";

const driverName = process.env.STORAGE_DRIVER || "local-fs";

let _storage: StorageDriver;
switch (driverName) {
  case "s3":
    _storage = s3Driver;
    break;
  case "local-fs":
  default:
    _storage = localFsDriver;
    break;
}

export const storage: StorageDriver = _storage;
export type { StorageDriver };

/**
 * Helper : génère une clé S3 hiérarchique pour une photo.
 * Pattern : org/{orgId}/projects/{projectId}/photos/{photoId}/{variant}.{ext}
 */
export function photoKey(opts: {
  organizationId: string;
  projectId: string;
  photoId: string;
  variant: "original" | "thumb" | "medium";
  ext: string;
}): string {
  return `org/${opts.organizationId}/projects/${opts.projectId}/photos/${opts.photoId}/${opts.variant}.${opts.ext}`;
}

export function reportKey(opts: {
  organizationId: string;
  projectId: string;
  reportId: string;
}): string {
  return `org/${opts.organizationId}/projects/${opts.projectId}/reports/${opts.reportId}.pdf`;
}
