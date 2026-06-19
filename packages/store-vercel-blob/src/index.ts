import { del, list, put } from "@vercel/blob";
import type { ConfigStore } from "@zeevolabs/landlink-admin";

export interface VercelBlobStoreOptions {
  /** Vercel Blob read/write token. Default: `process.env.BLOB_READ_WRITE_TOKEN` */
  token?: string;
  /** Path within the blob store. Default: `"landlink/config.json"` */
  path?: string;
}

const DEFAULT_PATH = "landlink/config.json";

export function createVercelBlobStore(options?: VercelBlobStoreOptions): ConfigStore {
  const token = options?.token ?? process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const path = options?.path ?? DEFAULT_PATH;

  return {
    async get() {
      try {
        const { blobs } = await list({ prefix: path, token, limit: 1 });
        const blob = blobs[0];
        if (!blob) return null;
        const response = await fetch(blob.url);
        if (!response.ok) return null;
        return (await response.json()) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
    async put(config) {
      const { blobs } = await list({ prefix: path, token, limit: 1 });
      if (blobs[0]) await del(blobs[0].url, { token });
      await put(path, JSON.stringify(config), {
        access: "public",
        token,
        addRandomSuffix: false,
      });
    },
  };
}
