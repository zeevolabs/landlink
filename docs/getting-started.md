# Getting started

## 1. Install

```bash
pnpm add @zeevolabs/landlink zod react react-dom
```

## 2. Write a config

The config is the whole page as data. `defineConfig` gives you autocomplete and type
checking while you author it.

```ts
// landlink.config.ts
import { defineConfig } from "@zeevolabs/landlink";

export default defineConfig({
  profile: {
    name: "Alex Rivera",
    avatar: "/avatar.svg",
    bio: "Full-stack developer & OSS contributor",
    verified: true,
  },
  theme: "rose",
  blocks: [
    { type: "heading", text: "Projects" },
    { type: "link", label: "GitHub", url: "https://github.com/alexrivera" },
    { type: "link", label: "Blog", url: "https://alexrivera.dev/blog", variant: "outline" },
    { type: "social", items: [{ platform: "Instagram", url: "https://instagram.com/…" }] },
  ],
});
```

## 3. Render it

Import the stylesheet once, then render `<Landlink/>` anywhere.

```tsx
import { Landlink } from "@zeevolabs/landlink";
import "@zeevolabs/landlink/styles.css";
import config from "./landlink.config";

export default function Page() {
  return <Landlink config={config} />;
}
```

## Next.js

`<Landlink/>` holds no client state, so it renders on the server. Load the config in a
Server Component and derive your metadata from it:

```tsx
// app/page.tsx
import { Landlink } from "@zeevolabs/landlink";
import type { Metadata } from "next";
import config from "../landlink.config";

export function generateMetadata(): Metadata {
  return { title: config.meta?.title ?? config.profile.name, description: config.profile.bio };
}

export default function Page() {
  return <Landlink config={config} />;
}
```

Import `@zeevolabs/landlink/styles.css` once in your root layout. See
[`examples/next-app`](../examples/next-app) for a complete, deployable setup.

## Validating untrusted config

`defineConfig` is for hand-written configs. When the config comes from JSON, a CMS, or a
database, validate it at runtime instead:

```ts
import { parseConfig } from "@zeevolabs/landlink";

const config = parseConfig(JSON.parse(raw)); // throws on invalid input
```

Use `safeParseConfig` if you'd rather handle the error yourself. See
[Config reference](config.md) and [Custom blocks](custom-blocks.md) for more.
