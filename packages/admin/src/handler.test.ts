import { createRegistry, defaultBlocks } from "@zeevolabs/landlink";
import { describe, expect, it } from "vitest";
import { createAdminHandler } from "./handler";
import type { ConfigStore } from "./types";

const registry = createRegistry(defaultBlocks);

const validConfig = {
  profile: { name: "Test" },
  blocks: [{ type: "link", label: "Click", url: "https://example.com" }],
};

function createMockStore(initial: Record<string, unknown> | null = null): ConfigStore {
  let data = initial;
  return {
    async get() {
      return data;
    },
    async put(config) {
      data = config;
    },
  };
}

function authRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/admin/config", {
    method,
    headers: {
      "x-admin-password": "secret",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function unauthRequest(method: string): Request {
  return new Request("http://localhost/api/admin/config", { method });
}

describe("createAdminHandler", () => {
  it("GET returns null when store is empty", async () => {
    const handler = createAdminHandler({ store: createMockStore(), password: "secret", registry });
    const res = await handler.GET(authRequest("GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it("GET returns stored config", async () => {
    const handler = createAdminHandler({
      store: createMockStore(validConfig),
      password: "secret",
      registry,
    });
    const res = await handler.GET(authRequest("GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(validConfig);
  });

  it("GET returns 401 without password", async () => {
    const handler = createAdminHandler({ store: createMockStore(), password: "secret", registry });
    const res = await handler.GET(unauthRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("PUT saves valid config", async () => {
    const store = createMockStore();
    const handler = createAdminHandler({ store, password: "secret", registry });
    const res = await handler.PUT(authRequest("PUT", validConfig));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await store.get()).toMatchObject(validConfig);
  });

  it("PUT returns 400 for invalid config", async () => {
    const handler = createAdminHandler({ store: createMockStore(), password: "secret", registry });
    const res = await handler.PUT(authRequest("PUT", { invalid: true }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.issues).toBeDefined();
  });

  it("PUT returns 401 without password", async () => {
    const handler = createAdminHandler({ store: createMockStore(), password: "secret", registry });
    const res = await handler.PUT(unauthRequest("PUT"));
    expect(res.status).toBe(401);
  });
});
