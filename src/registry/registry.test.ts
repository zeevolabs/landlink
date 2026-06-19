import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineBlock } from "../blocks/define-block";
import { createRegistry } from "./registry";

const a = defineBlock({ type: "a", data: z.object({ x: z.string() }), component: () => null });
const b = defineBlock({ type: "b", data: z.object({}), component: () => null });

describe("createRegistry", () => {
  it("resolves registered blocks and lists their types", () => {
    const registry = createRegistry([a]).register(b);
    expect(registry.list()).toEqual(["a", "b"]);
    expect(registry.resolve("a")).toBe(a);
    expect(registry.resolve("missing")).toBeUndefined();
  });

  it("overrides a block when re-registering the same type", () => {
    const a2 = defineBlock({ type: "a", data: z.object({ y: z.string() }), component: () => null });
    const registry = createRegistry([a]).register(a2);
    expect(registry.resolve("a")).toBe(a2);
    expect(registry.list()).toEqual(["a"]);
  });

  it("does not mutate the source registry on register", () => {
    const base = createRegistry([a]);
    base.register(b);
    expect(base.list()).toEqual(["a"]);
  });
});
