# Custom blocks

Built-in blocks cover the basics. Anything else — an embed, a gallery, a countdown — is a
custom block. A block is just a Zod schema plus the component that renders it, and the
registry is the only thing the renderer depends on. That's the whole extension model.

## 1. Define a block

`defineBlock` pairs a schema for the block's data with its component. The `type` is added
to the schema for you and passed to the component as a prop.

```tsx
import { defineBlock } from "@zeevolabs/landlink";
import { z } from "zod";

export const highlightBlock = defineBlock({
  type: "highlight",
  data: z.object({ emoji: z.string().optional(), text: z.string().min(1) }),
  component: ({ emoji, text }) => (
    <div className="highlight">
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
      <strong>{text}</strong>
    </div>
  ),
});
```

## 2. Compose a registry

Add your block to the built-ins. `createRegistry` is immutable — `register` returns a new
registry, so nothing is shared by accident.

```ts
import { createRegistry, defaultBlocks } from "@zeevolabs/landlink";
import { highlightBlock } from "./blocks/highlight";

export const registry = createRegistry([...defaultBlocks, highlightBlock]);
```

## 3. Parse and render with it

Pass the registry to both `parseConfig` (so the custom block is validated against its
schema) and `<Landlink/>` (so it can be resolved at render time).

```tsx
import { Landlink, parseConfig } from "@zeevolabs/landlink";
import { registry } from "./registry";

const config = parseConfig(
  {
    profile: { name: "Alex Rivera" },
    blocks: [{ type: "highlight", emoji: "✨", text: "Open this week!" }],
  },
  registry,
);

export default function Page() {
  return <Landlink config={config} registry={registry} />;
}
```

If you author the config by hand instead, `defineConfig` accepts custom block types via an
open fallback, so `{ type: "highlight", … }` type-checks. Runtime validation still happens
at `parseConfig`.

## Notes

- **Override a built-in** by registering a block with the same `type` after it — the last
  registration wins. This is how you swap, say, the default text-only `social` block for
  one that renders real icons.
- **Validation is per block.** Each block is validated against its own schema, so errors
  point at the exact field that's wrong.
- **Keep blocks render-only** if you want Server Component compatibility; add `"use client"`
  only to the blocks that genuinely need interactivity.
