import { Redis } from "@upstash/redis";

export interface UpstashStoreOptions {
  key?: string;
  url?: string;
  token?: string;
}

export function createUpstashStore(options?: UpstashStoreOptions) {
  const redis =
    options?.url && options?.token
      ? new Redis({ url: options.url, token: options.token })
      : Redis.fromEnv();
  const key = options?.key ?? "landlink:booking";

  return {
    async get(): Promise<Record<string, unknown> | null> {
      const data = await redis.get<Record<string, unknown>>(key);
      return data ?? null;
    },
    async put(data: Record<string, unknown>): Promise<void> {
      await redis.set(key, data);
    },
  };
}
