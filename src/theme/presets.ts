import type { ThemeTokens } from "./tokens";

const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const themePresets = {
  light: {
    bg: "#ffffff",
    fg: "#111827",
    accent: "#111827",
    accentContrast: "#ffffff",
    muted: "#6b7280",
    border: "#e5e7eb",
    radius: "14px",
    shadow: "0 1px 2px rgba(17, 24, 39, 0.08)",
    font: sans,
    maxWidth: "560px",
  },
  dark: {
    bg: "#0b0b0f",
    fg: "#f5f5f7",
    accent: "#f5f5f7",
    accentContrast: "#0b0b0f",
    muted: "#9ca3af",
    border: "#26262e",
    radius: "14px",
    shadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
    font: sans,
    maxWidth: "560px",
  },
  rose: {
    bg: "#fdf2f6",
    fg: "#3f2733",
    accent: "#e0719b",
    accentContrast: "#ffffff",
    muted: "#9a6c7e",
    border: "#f3d4e0",
    radius: "999px",
    shadow: "0 2px 10px rgba(224, 113, 155, 0.25)",
    font: sans,
    maxWidth: "560px",
  },
  mint: {
    bg: "#f0fbf6",
    fg: "#16352a",
    accent: "#1f9d6b",
    accentContrast: "#ffffff",
    muted: "#5b8475",
    border: "#cdeede",
    radius: "14px",
    shadow: "0 2px 10px rgba(31, 157, 107, 0.18)",
    font: sans,
    maxWidth: "560px",
  },
} satisfies Record<string, ThemeTokens>;

export type PresetName = keyof typeof themePresets;
export const defaultPreset: PresetName = "light";
