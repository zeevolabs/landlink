import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defaultBlocks } from "../blocks";
import { defineBlock } from "../blocks/define-block";
import { createRegistry } from "../registry/registry";
import { parseConfig, safeParseConfig } from "./parse";

const valid = {
  profile: { name: "Alex" },
  theme: "dark",
  blocks: [
    { type: "link", label: "GitHub", url: "https://github.com/alex" },
    { type: "social", items: [{ platform: "instagram", url: "https://ig.com/x" }] },
  ],
};

describe("parseConfig", () => {
  it("accepts a valid config", () => {
    const config = parseConfig(valid);
    expect(config.profile.name).toBe("Alex");
    expect(config.blocks).toHaveLength(2);
  });

  it("rejects a profile without a name", () => {
    expect(safeParseConfig({ profile: {}, blocks: [] }).success).toBe(false);
  });

  it("rejects an unknown block type with the default registry", () => {
    const result = safeParseConfig({ profile: { name: "x" }, blocks: [{ type: "ghost" }] });
    expect(result.success).toBe(false);
  });

  it("validates a custom block against its own schema", () => {
    const embed = defineBlock({
      type: "embed",
      data: z.object({ src: z.string().url() }),
      component: () => null,
    });
    const registry = createRegistry([...defaultBlocks, embed]);

    const ok = safeParseConfig(
      { profile: { name: "x" }, blocks: [{ type: "embed", src: "https://e.com" }] },
      registry,
    );
    const bad = safeParseConfig(
      { profile: { name: "x" }, blocks: [{ type: "embed", src: "not-a-url" }] },
      registry,
    );

    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});
