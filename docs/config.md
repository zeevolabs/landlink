# Config reference

A config has four parts:

```ts
interface Config {
  profile: Profile; // the header
  theme?: Theme;    // a preset name or token overrides
  meta?: Meta;      // SEO metadata
  blocks: Block[];  // the page body, rendered top to bottom
}
```

## `profile`

The header shown above the blocks.

| Field      | Type      | Required | Notes                          |
| ---------- | --------- | -------- | ------------------------------ |
| `name`     | `string`  | yes      | Rendered as the page `<h1>`.   |
| `avatar`   | `string`  | no       | Image URL or path.             |
| `bio`      | `string`  | no       | Short description.             |
| `verified` | `boolean` | no       | Shows a check next to the name.|

## `theme`

A preset name (`"light"`, `"dark"`, `"rose"`, `"mint"`) or an object that overrides
individual [design tokens](theming.md). Omit it to use the default `light` preset.

```ts
theme: "dark";
theme: { accent: "#e0719b", radius: "999px" };
```

## `meta`

Optional SEO fields. landlink does not inject tags itself — read these in your framework
(e.g. Next.js `generateMetadata`). All fields are optional: `title`, `description`,
`image`, `url`.

## `blocks`

An ordered array. Each block is an object with a `type` and the fields for that type.
Unknown types are skipped when rendering and rejected by `parseConfig`.

### `link`

```ts
{ type: "link", label: "My Portfolio", url: "https://…", description?: "20+ projects", variant?: "fill" | "outline", icon?: "→" }
```

Renders an external anchor (`target="_blank"`, `rel="noopener noreferrer"`). `variant`
defaults to `"fill"`. `description` shows a smaller subtitle under the label.

### `social`

```ts
{ type: "social", items: [{ platform: "Instagram", url: "https://…", label?: "@handle" }] }
```

A row of links. `label` overrides the visible text; otherwise `platform` is shown.

### `heading`

```ts
{ type: "heading", text: "Booking" }
```

A small section title (`<h2>`) to group the blocks below it.

### `image`

```ts
{ type: "image", src: "/promo.jpg", alt?: "Promo", href?: "https://…" }
```

A full-width image, optionally wrapped in a link.

## Parsing

`defineConfig(config)` is a typed identity function for authoring — no runtime cost.

`parseConfig(input, registry?)` validates unknown input and throws on failure.
`safeParseConfig(input, registry?)` returns a Zod result instead of throwing. Pass a
[registry](custom-blocks.md) to validate custom block types.
