import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import type { ConfigStore } from "@zeevolabs/landlink-admin";

export interface FileStoreOptions {
  /** Absolute or relative path to the JSON config file. Default: `data/landlink.config.json` */
  path?: string;
}

const DEFAULT_PATH = join("data", "landlink.config.json");

export function createFileStore(options?: FileStoreOptions): ConfigStore {
  const raw = options?.path ?? DEFAULT_PATH;
  const filePath = isAbsolute(raw) ? raw : join(process.cwd(), raw);

  return {
    async get() {
      try {
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
    async put(config) {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(config, null, 2));
    },
  };
}
