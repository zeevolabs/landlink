import type { Config, Registry } from "@zeevolabs/landlink";
import { safeParseConfig } from "@zeevolabs/landlink";
import { zodToFields } from "./zod-to-fields";
import { checkPassword } from "./auth";
import type { ConfigStore } from "./types";

export interface IntegrationHandler {
  route: (request: Request) => Promise<Response>;
}

export interface AdminHandlerOptions {
  store: ConfigStore;
  password: string | undefined;
  registry: Registry;
  fallback?: () => Config;
  uploadFile?: (file: File) => Promise<string>;
  integrations?: Record<string, IntegrationHandler>;
}

export function createAdminHandler({ store, password, registry, fallback, uploadFile, integrations }: AdminHandlerOptions) {
  async function GET(request: Request) {
    const auth = checkPassword(request, password);
    if (!auth.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = await store.get();
    return Response.json(data);
  }

  async function PUT(request: Request) {
    const auth = checkPassword(request, password);
    if (!auth.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const result = safeParseConfig(body, registry);
    if (!result.success) {
      return Response.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    await store.put(result.data as unknown as Record<string, unknown>);
    return Response.json({ ok: true });
  }

  async function POST(request: Request) {
    if (!uploadFile) {
      return Response.json({ error: "Upload not configured" }, { status: 501 });
    }
    const auth = checkPassword(request, password);
    if (!auth.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    try {
      const url = await uploadFile(file);
      return Response.json({ url });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  async function loadConfig(): Promise<Config> {
    try {
      const raw = await store.get();
      if (raw) {
        const result = safeParseConfig(raw, registry);
        if (result.success) return result.data;
      }
    } catch {
      // store unavailable, use fallback
    }
    if (fallback) return fallback();
    throw new Error("No config in store and no fallback provided");
  }

  function getSchema(_request: Request) {
    const auth = checkPassword(_request, password);
    if (!auth.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const types = registry.list();
    const schemas: Record<string, unknown> = {};
    for (const type of types) {
      const def = registry.resolve(type);
      if (def) schemas[type] = zodToFields(def.schema);
    }
    return Response.json({ types, schemas });
  }

  async function seed(request: Request) {
    const auth = checkPassword(request, password);
    if (!auth.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const config = await loadConfig();
    return Response.json(config);
  }

  async function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").filter(Boolean);
    const action = segments[0] ?? "";

    if (integrations && segments.length >= 2) {
      const handler = integrations[action];
      if (handler) return handler.route(request);
    }

    if (request.method === "GET") {
      switch (action) {
        case "config": return GET(request);
        case "schema": return getSchema(request);
        case "seed": return seed(request);
      }
    }
    if (request.method === "PUT" && action === "config") return PUT(request);
    if (request.method === "POST" && action === "upload") return POST(request);

    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return { GET, PUT, POST, loadConfig, route, getSchema, seed };
}
