// src/lib/storage/types.ts
// Interface commune aux drivers de stockage. Le code applicatif n'utilise QUE
// cette interface ; le driver concret est sélectionné par STORAGE_DRIVER en env.

export interface StorageDriver {
  /**
   * Génère une URL pré-signée pour upload PUT direct depuis le navigateur.
   * Le client envoie ensuite le binaire via PUT à cette URL avec les headers
   * Content-Type spécifié.
   */
  presignUpload(opts: {
    key: string;
    contentType: string;
    bytes: number;
    ttlSeconds?: number;
  }): Promise<{ url: string; method: "PUT"; headers: Record<string, string>; expiresAt: Date }>;

  /**
   * Génère une URL pré-signée pour téléchargement GET (lecture).
   * Retourne null si l'objet n'existe pas.
   */
  presignDownload(opts: {
    key: string;
    ttlSeconds?: number;
    contentDisposition?: string;
  }): Promise<{ url: string; expiresAt: Date } | null>;

  /**
   * Upload server-side (utilisé pour génération PDF stockée par le worker).
   */
  putObject(opts: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ key: string; etag: string }>;

  /**
   * Téléchargement server-side (utilisé pour analyse photo par les agents).
   */
  getObject(key: string): Promise<{
    body: Buffer;
    contentType: string;
    bytes: number;
    metadata?: Record<string, string>;
  } | null>;

  /**
   * Suppression. Pas de hard delete : les drivers prod doivent gérer un
   * versioning + tombstone côté backend.
   */
  deleteObject(key: string): Promise<boolean>;

  /**
   * Récupère les métadonnées sans le binaire.
   */
  headObject(key: string): Promise<{
    bytes: number;
    contentType: string;
    etag: string;
    lastModified: Date;
  } | null>;
}
