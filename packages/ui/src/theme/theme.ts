export type Theme = "light" | "dark";

export interface ThemeRoot {
  dataset: {
    theme?: string;
  };
}

export const DEFAULT_THEME: Theme = "light";

export const THEME_TOKENS = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    raised: "#F7FAFB",
    text: "#13243A",
    muted: "#6F7F8E",
  },
  dark: {
    background: "#000000",
    surface: "#090909",
    raised: "#111111",
    text: "#FFFFFF",
    muted: "#B9B9B9",
  },
} as const;

export function applyTheme(root: ThemeRoot, theme: Theme): void {
  root.dataset.theme = theme;
}
