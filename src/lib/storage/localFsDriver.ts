// src/lib/storage/localFsDriver.ts
// Driver local-fs pour développement uniquement. URLs présignées non
// supportées : retourne des routes Next.js qui servent les fichiers.
// Stockage dans LOCAL_STORAGE_PATH (./storage par défaut).

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StorageDriver } from "./types";

const ROOT = path.resolve(process.env.LOCAL_STORAGE_PATH || "./storage");

async function ensureDir(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

function fullPath(key: string) {
  // Empêche les path traversal
  const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(ROOT, safe);
}

export const localFsDriver: StorageDriver = {
  async presignUpload({ key, contentType, ttlSeconds = 900 }) {
    const token = crypto.randomBytes(16).toString("hex");
    return {
      url: `/api/storage/upload?key=${encodeURIComponent(key)}&token=${token}`,
      method: "PUT",
      headers: { "Content-Type": contentType },
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  },

  async presignDownload({ key, ttlSeconds = 900 }) {
    const exists = await fs.stat(fullPath(key)).then(() => true).catch(() => false);
    if (!exists) return null;
    const token = crypto.randomBytes(16).toString("hex");
    return {
      url: `/api/storage/download?key=${encodeURIComponent(key)}&token=${token}`,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  },

  async putObject({ key, body, contentType, metadata }) {
    const p = fullPath(key);
    await ensureDir(p);
    await fs.writeFile(p, body);
    if (metadata) {
      await fs.writeFile(`${p}.meta.json`, JSON.stringify({ contentType, metadata }));
    }
    const etag = crypto.createHash("md5").update(body).digest("hex");
    return { key, etag };
  },

  async getObject(key) {
    try {
      const p = fullPath(key);
      const body = await fs.readFile(p);
      let contentType = "application/octet-stream";
      let metadata: Record<string, string> | undefined;
      try {
        const meta = JSON.parse(await fs.readFile(`${p}.meta.json`, "utf8"));
        contentType = meta.contentType || contentType;
        metadata = meta.metadata;
      } catch { /* no meta */ }
      return { body, contentType, bytes: body.length, metadata };
    } catch {
      return null;
    }
  },

  async deleteObject(key) {
    try {
      await fs.unlink(fullPath(key));
      await fs.unlink(`${fullPath(key)}.meta.json`).catch(() => {});
      return true;
    } catch {
      return false;
    }
  },

  async headObject(key) {
    try {
      const p = fullPath(key);
      const stat = await fs.stat(p);
      let contentType = "application/octet-stream";
      try {
        const meta = JSON.parse(await fs.readFile(`${p}.meta.json`, "utf8"));
        contentType = meta.contentType || contentType;
      } catch { /* */ }
      return {
        bytes: stat.size,
        contentType,
        etag: `${stat.size}-${stat.mtimeMs}`,
        lastModified: stat.mtime,
      };
    } catch {
      return null;
    }
  },
};
