import type { ZodTypeAny } from "zod";

export interface FieldDescriptor {
  name: string;
  type: "string" | "boolean" | "enum" | "array" | "object";
  required: boolean;
  options?: string[];
  children?: FieldDescriptor[];
}

function unwrap(schema: ZodTypeAny): { inner: ZodTypeAny; required: boolean } {
  const typeName = schema._def.typeName as string;
  if (typeName === "ZodOptional" || typeName === "ZodDefault") {
    return { inner: schema._def.innerType, required: false };
  }
  return { inner: schema, required: true };
}

function toField(name: string, raw: ZodTypeAny): FieldDescriptor {
  const { inner, required } = unwrap(raw);
  const typeName = inner._def.typeName as string;

  if (typeName === "ZodBoolean") {
    return { name, type: "boolean", required };
  }

  if (typeName === "ZodEnum") {
    return { name, type: "enum", required, options: inner._def.values as string[] };
  }

  if (typeName === "ZodArray") {
    const element = inner._def.type as ZodTypeAny;
    const elementType = element._def.typeName as string;
    if (elementType === "ZodObject") {
      return { name, type: "array", required, children: zodToFields(element) };
    }
    return { name, type: "array", required };
  }

  if (typeName === "ZodObject") {
    return { name, type: "object", required, children: zodToFields(inner) };
  }

  return { name, type: "string", required };
}

export function zodToFields(schema: ZodTypeAny): FieldDescriptor[] {
  const { inner } = unwrap(schema);
  const typeName = inner._def.typeName as string;
  if (typeName !== "ZodObject") return [];

  const shape = inner._def.shape() as Record<string, ZodTypeAny>;
  return Object.entries(shape)
    .filter(([key]) => key !== "type")
    .map(([key, value]) => toField(key, value));
}
