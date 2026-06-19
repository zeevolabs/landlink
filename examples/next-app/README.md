# landlink — Next.js example

A complete link-in-bio page built from a single config, including a custom `highlight`
block and SEO metadata.

```bash
pnpm install        # from the repo root
pnpm --filter next-app dev
```

Open http://localhost:3000.

Key files:

- [`landlink.config.ts`](landlink.config.ts) — the page as data, parsed against a registry.
- [`blocks/highlight.tsx`](blocks/highlight.tsx) — a custom block.
- [`app/page.tsx`](app/page.tsx) — renders `<Landlink/>` and derives `generateMetadata`.
- [`app/globals.css`](app/globals.css) — imports `@zeevolabs/landlink/styles.css` and styles the custom block.
