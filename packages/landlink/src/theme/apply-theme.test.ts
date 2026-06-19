import { describe, expect, it } from "vitest";
import { applyTheme, resolveTheme } from "./apply-theme";
import { themePresets } from "./presets";

describe("resolveTheme", () => {
  it("returns a named preset", () => {
    expect(resolveTheme("dark")).toEqual(themePresets.dark);
  });

  it("falls back to the default preset for unknown names", () => {
    expect(resolveTheme("nope")).toEqual(themePresets.light);
  });

  it("merges inline overrides over the default preset", () => {
    const tokens = resolveTheme({ accent: "#f00" });
    expect(tokens.accent).toBe("#f00");
    expect(tokens.bg).toBe(themePresets.light.bg);
  });
});

describe("applyTheme", () => {
  it("maps tokens to CSS custom properties", () => {
    const style = applyTheme("rose") as Record<string, string>;
    expect(style["--ll-accent"]).toBe(themePresets.rose.accent);
    expect(style["--ll-shadow"]).toBe(themePresets.rose.shadow);
  });
});
