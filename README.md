<h1 align="center">landlink</h1>

<p align="center">
  Your links, your code, your rules.<br/>
  Build <strong>link-in-bio</strong> pages with React &amp; Next.js — no vendor lock-in.
</p>

<p align="center">
  <a href="https://github.com/zeevolabs/landlink/actions"><img src="https://img.shields.io/github/actions/workflow/status/zeevolabs/landlink/ci.yml?branch=main&style=flat-square" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@zeevolabs/landlink"><img src="https://img.shields.io/npm/v/@zeevolabs/landlink?style=flat-square&color=0b0b0f" alt="npm" /></a>
  <a href="https://bundlephobia.com/package/@zeevolabs/landlink"><img src="https://img.shields.io/bundlephobia/minzip/@zeevolabs/landlink?style=flat-square&label=size" alt="bundle size" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/zeevolabs/landlink?style=flat-square" alt="license" /></a>
</p>

---

Services like Linktree are great to get started — but at some point you want to own
your page. You want your own domain, your own design, your own components, and data that
lives in your repo instead of someone else's dashboard.

**landlink** lets you describe a link-in-bio page as a simple config file and render it
with a single React component. Pick a theme preset or bring your own design tokens. Need
a block that doesn't exist? Write a component, register it, done — the core never changes.
It works as a Server Component, prerenders in Next.js, and ships as static HTML.

## Quick start

```bash
pnpm add @zeevolabs/landlink zod react react-dom
```

**1. Define your page**

```ts
// landlink.config.ts
import { defineConfig } from "@zeevolabs/landlink";

export default defineConfig({
  profile: {
    name: "Alex Rivera",
    avatar: "/avatar.svg",
    bio: "Full-stack developer & OSS contributor",
  },
  theme: "dark",
  blocks: [
    { type: "link", label: "GitHub", url: "https://github.com/alexrivera" },
    { type: "link", label: "Blog", url: "https://alexrivera.dev/blog", variant: "outline" },
    { type: "social", items: [
      { platform: "LinkedIn", url: "https://linkedin.com/in/alexrivera" },
      { platform: "X", url: "https://x.com/alexrivera" },
    ]},
  ],
});
```

**2. Render it**

```tsx
import { Landlink } from "@zeevolabs/landlink";
import "@zeevolabs/landlink/styles.css";
import config from "./landlink.config";

export default function Page() {
  return <Landlink config={config} />;
}
```

That's it. The page is statically renderable, SSR-ready, and fully typed.

## Features

| | |
| --- | --- |
| **Config as code** | `defineConfig` with full autocomplete; `parseConfig` validates untrusted input at runtime via Zod |
| **Built-in blocks** | `link` · `social` · `heading` · `image` — covers the 90% case out of the box |
| **Custom blocks** | `defineBlock` pairs a Zod schema with a React component; the registry resolves it — no core changes needed |
| **CSS-variable theming** | 4 presets (`light` `dark` `rose` `mint`) or bring your own tokens; zero CSS-in-JS, zero Tailwind |
| **Server Component ready** | `<Landlink/>` is render-only — works as an RSC, prerenders in Next.js, exports as static HTML |
| **Tiny footprint** | One dependency (`zod`); React is a peer dep; output is tree-shakeable ESM + CJS |

## Built-in blocks

| Type | Fields |
| --- | --- |
| `link` | `label` `url` `description?` `variant?` (`fill` \| `outline`) `icon?` |
| `social` | `items: { platform, url, label? }[]` |
| `heading` | `text` |
| `image` | `src` `alt?` `href?` |

Need something else? See [Custom blocks](docs/custom-blocks.md).

## Theming

Set `theme` to a preset name or pass inline token overrides:

```ts
theme: "rose"
theme: { accent: "#6366f1", radius: "999px", shadow: "0 4px 12px rgba(0,0,0,.1)" }
```

Every token maps to a CSS variable (`--ll-accent`, `--ll-radius`, …) consumed by `landlink/styles.css`.
Full reference: [Theming docs](docs/theming.md).

## Documentation

- [Getting started](docs/getting-started.md)
- [Config reference](docs/config.md)
- [Theming](docs/theming.md)
- [Custom blocks](docs/custom-blocks.md)

A runnable Next.js example lives in [`examples/next-app`](examples/next-app).

## Contributing

```bash
pnpm install        # install deps
pnpm test           # vitest (20 tests)
pnpm typecheck      # tsc --noEmit
pnpm lint           # biome
pnpm build          # tsup → dist/
```

CI runs all four checks on every push and PR.

## License

[MIT](LICENSE)
