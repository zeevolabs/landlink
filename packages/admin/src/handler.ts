import type { Config, Registry } from "@zeevolabs/landlink";
import { safeParseConfig } from "@zeevolabs/landlink";
import { checkPassword } from "./auth";
import type { ConfigStore } from "./types";

export interface AdminHandlerOptions {
  store: ConfigStore;
  password: string | undefined;
  registry: Registry;
  fallback?: () => Config;
  uploadFile?: (file: File) => Promise<string>;
}

export function createAdminHandler({ store, password, registry, fallback, uploadFile }: AdminHandlerOptions) {
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

  return { GET, PUT, POST, loadConfig };
}
