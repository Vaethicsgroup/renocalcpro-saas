// src/lib/storage/s3Driver.ts
// Driver S3-compatible (AWS S3, OVH Public Cloud Storage, MinIO, …).
// Utilise AWS SDK v3 + @aws-sdk/s3-request-presigner pour les URLs présignées.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./types";

const region = process.env.S3_REGION || "gra";
const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET || "renocal";
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
const defaultTtl = Number(process.env.S3_PRESIGN_TTL_SECONDS || 900);

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export const s3Driver: StorageDriver = {
  async presignUpload({ key, contentType, ttlSeconds = defaultTtl }) {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: ttlSeconds });
    return {
      url,
      method: "PUT",
      headers: { "Content-Type": contentType, "x-amz-server-side-encryption": "AES256" },
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  },

  async presignDownload({ key, ttlSeconds = defaultTtl, contentDisposition }) {
    try {
      // HEAD pour vérifier l'existence
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      return null;
    }
    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition,
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: ttlSeconds });
    return { url, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  },

  async putObject({ key, body, contentType, metadata }) {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: "AES256",
    });
    const r = await s3.send(cmd);
    return { key, etag: r.ETag?.replace(/"/g, "") || "" };
  },

  async getObject(key) {
    try {
      const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const chunks: Buffer[] = [];
      for await (const chunk of r.Body as AsyncIterable<Buffer>) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      return {
        body,
        contentType: r.ContentType || "application/octet-stream",
        bytes: body.length,
        metadata: r.Metadata,
      };
    } catch {
      return null;
    }
  },

  async deleteObject(key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  },

  async headObject(key) {
    try {
      const r = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        bytes: r.ContentLength || 0,
        contentType: r.ContentType || "application/octet-stream",
        etag: r.ETag?.replace(/"/g, "") || "",
        lastModified: r.LastModified || new Date(),
      };
    } catch {
      return null;
    }
  },
};
