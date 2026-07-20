export const themeTokens = {
  bg: "--ll-bg",
  fg: "--ll-fg",
  accent: "--ll-accent",
  accentContrast: "--ll-accent-contrast",
  muted: "--ll-muted",
  border: "--ll-border",
  radius: "--ll-radius",
  shadow: "--ll-shadow",
  font: "--ll-font",
  maxWidth: "--ll-max-width",
  bgAnimation: "--ll-bg-animation",
  avatarSize: "--ll-avatar-size",
} as const;

export type TokenName = keyof typeof themeTokens;
export type ThemeTokens = Record<TokenName, string>;
