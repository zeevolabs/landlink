import type { ComponentType } from "react";
import { type ZodObject, type ZodRawShape, type ZodTypeAny, z } from "zod";

export type BlockProps = { type: string } & Record<string, unknown>;

export interface BlockDefinition {
  type: string;
  schema: ZodTypeAny;
  component: ComponentType<BlockProps>;
}

export function defineBlock<T extends string, Shape extends ZodRawShape>(def: {
  type: T;
  data: ZodObject<Shape>;
  component: ComponentType<z.infer<ZodObject<Shape>> & { type: T }>;
}): BlockDefinition {
  const schema = def.data.extend({ type: z.literal(def.type) });
  return {
    type: def.type,
    schema,
    component: def.component as unknown as ComponentType<BlockProps>,
  };
}
