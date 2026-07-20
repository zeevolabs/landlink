import { type SafeParseReturnType, type ZodTypeAny, z } from "zod";
import { defaultBlocks } from "../blocks";
import { type Registry, createRegistry } from "../registry/registry";
import { effectsSchema, metaSchema, profileSchema, themeSchema } from "./schema";
import type { Config } from "./types";

type Option = z.ZodDiscriminatedUnionOption<"type">;

const defaultRegistry = createRegistry(defaultBlocks);

function blockSchema(registry: Registry): ZodTypeAny {
  const [first, ...rest] = registry.schemas() as unknown as Option[];
  if (!first) throw new Error("landlink: registry has no block types");
  if (rest.length === 0) return first;
  return z.discriminatedUnion("type", [first, ...rest]);
}

export function configSchema(registry: Registry = defaultRegistry) {
  return z.object({
    profile: profileSchema,
    theme: themeSchema.optional(),
    effects: effectsSchema,
    meta: metaSchema.optional(),
    blocks: z.array(blockSchema(registry)),
  });
}

export function parseConfig(input: unknown, registry: Registry = defaultRegistry): Config {
  return configSchema(registry).parse(input) as Config;
}

export function safeParseConfig(
  input: unknown,
  registry: Registry = defaultRegistry,
): SafeParseReturnType<unknown, Config> {
  return configSchema(registry).safeParse(input) as SafeParseReturnType<unknown, Config>;
}
