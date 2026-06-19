# Theming

landlink themes are plain **CSS custom properties**. The renderer sets them on the root
element from your `theme`, and `@zeevolabs/landlink/styles.css` consumes them. No CSS-in-JS, no build
step, fully overridable.

## Presets

Set `theme` to a preset name:

```ts
theme: "rose"; // "light" | "dark" | "rose" | "mint"
```

`light` is the default when `theme` is omitted.

## Token overrides

Pass an object to override individual tokens on top of the default preset:

```ts
theme: { accent: "#e0719b", accentContrast: "#ffffff", radius: "999px" };
```

### Tokens

| Token            | CSS variable            | Used for                     |
| ---------------- | ----------------------- | ---------------------------- |
| `bg`             | `--ll-bg`               | Page background              |
| `fg`             | `--ll-fg`               | Text color                   |
| `accent`         | `--ll-accent`           | Primary buttons, highlights  |
| `accentContrast` | `--ll-accent-contrast`  | Text on accent               |
| `muted`          | `--ll-muted`            | Secondary text               |
| `border`         | `--ll-border`           | Borders, outlines            |
| `radius`         | `--ll-radius`           | Corner radius                |
| `shadow`         | `--ll-shadow`           | Button shadow                |
| `font`           | `--ll-font`             | Font family                  |
| `maxWidth`       | `--ll-max-width`        | Content column width         |

## Custom CSS

Every element uses a stable `ll-*` class (`ll-link`, `ll-social-item`, `ll-avatar`, …),
so you can target them from your own stylesheet. You can also read the same CSS variables
in your custom blocks to stay on theme:

```css
.my-block {
  border-radius: var(--ll-radius);
  background: var(--ll-accent);
  color: var(--ll-accent-contrast);
}
```

## Programmatic access

`themePresets`, `themeTokens`, `resolveTheme`, and `applyTheme` are exported if you need to
read tokens or build a theme switcher.
