import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodToFields } from "./zod-to-fields";

describe("zodToFields", () => {
  it("extracts string fields from a ZodObject", () => {
    const schema = z.object({
      type: z.literal("link"),
      label: z.string(),
      url: z.string(),
    });
    expect(zodToFields(schema)).toEqual([
      { name: "label", type: "string", required: true },
      { name: "url", type: "string", required: true },
    ]);
  });

  it("handles optional fields", () => {
    const schema = z.object({
      type: z.literal("link"),
      label: z.string(),
      description: z.string().optional(),
    });
    const fields = zodToFields(schema);
    expect(fields).toEqual([
      { name: "label", type: "string", required: true },
      { name: "description", type: "string", required: false },
    ]);
  });

  it("handles enum fields", () => {
    const schema = z.object({
      type: z.literal("link"),
      variant: z.enum(["default", "outline"]).optional(),
    });
    const fields = zodToFields(schema);
    expect(fields).toEqual([
      { name: "variant", type: "enum", required: false, options: ["default", "outline"] },
    ]);
  });

  it("handles boolean fields", () => {
    const schema = z.object({
      type: z.literal("test"),
      enabled: z.boolean(),
    });
    expect(zodToFields(schema)).toEqual([
      { name: "enabled", type: "boolean", required: true },
    ]);
  });

  it("handles array of objects", () => {
    const schema = z.object({
      type: z.literal("socials"),
      items: z.array(
        z.object({
          platform: z.string(),
          url: z.string(),
          label: z.string().optional(),
        }),
      ),
    });
    const fields = zodToFields(schema);
    expect(fields).toEqual([
      {
        name: "items",
        type: "array",
        required: true,
        children: [
          { name: "platform", type: "string", required: true },
          { name: "url", type: "string", required: true },
          { name: "label", type: "string", required: false },
        ],
      },
    ]);
  });

  it("handles default values as optional", () => {
    const schema = z.object({
      type: z.literal("link"),
      label: z.string().default("Click here"),
    });
    expect(zodToFields(schema)).toEqual([
      { name: "label", type: "string", required: false },
    ]);
  });

  it("returns empty array for non-object schemas", () => {
    expect(zodToFields(z.string())).toEqual([]);
  });
});
