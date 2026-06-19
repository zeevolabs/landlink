import type { ZodTypeAny } from "zod";
import type { BlockDefinition } from "../blocks/define-block";

export interface Registry {
  register(definition: BlockDefinition): Registry;
  resolve(type: string): BlockDefinition | undefined;
  list(): string[];
  schemas(): ZodTypeAny[];
}

export function createRegistry(initial: BlockDefinition[] = []): Registry {
  const map = new Map<string, BlockDefinition>();
  for (const def of initial) map.set(def.type, def);

  return {
    register(definition) {
      return createRegistry([...map.values(), definition]);
    },
    resolve(type) {
      return map.get(type);
    },
    list() {
      return [...map.keys()];
    },
    schemas() {
      return [...map.values()].map((def) => def.schema);
    },
  };
}
