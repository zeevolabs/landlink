import type { CSSProperties } from "react";
import { type PresetName, defaultPreset, themePresets } from "./presets";
import { type ThemeTokens, type TokenName, themeTokens } from "./tokens";

export type Theme = PresetName | (string & {}) | Partial<ThemeTokens>;

export function resolveTheme(theme?: Theme): ThemeTokens {
  if (!theme) return themePresets[defaultPreset];
  if (typeof theme === "string") {
    return (themePresets as Record<string, ThemeTokens>)[theme] ?? themePresets[defaultPreset];
  }
  return { ...themePresets[defaultPreset], ...theme };
}

export function applyTheme(theme?: Theme): CSSProperties {
  const values = resolveTheme(theme);
  const style: Record<string, string> = {};
  for (const key of Object.keys(themeTokens) as TokenName[]) {
    style[themeTokens[key]] = values[key];
  }
  return style as CSSProperties;
}
