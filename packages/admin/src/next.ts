import { createRegistry, defaultBlocks, type Config, type Registry, type BlockDefinition } from "@zeevolabs/landlink";
import { createAdminHandler } from "./handler";
import type { IntegrationHandler } from "./handler";
import type { ConfigStore } from "./types";

export interface AdminGatewayOptions {
  store: ConfigStore;
  password?: string;
  fallback?: () => Config;
  uploadFile?: (file: File) => Promise<string>;
  integrations?: Record<string, IntegrationHandler>;
  extraBlocks?: BlockDefinition[];
}

export function createAdminGateway(options: AdminGatewayOptions) {
  const blocks = [...defaultBlocks, ...(options.extraBlocks ?? [])];
  const registry = createRegistry(blocks);

  const handler = createAdminHandler({
    store: options.store,
    password: options.password,
    registry,
    fallback: options.fallback ?? (() => ({ profile: { name: "My Page" }, blocks: [] })),
    uploadFile: options.uploadFile,
    integrations: options.integrations,
  });

  async function handle(request: Request) {
    try {
      return await handler.route(request);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  return {
    GET: handle,
    POST: handle,
    PUT: handle,
    DELETE: handle,
    loadConfig: () => handler.loadConfig(),
  };
}
