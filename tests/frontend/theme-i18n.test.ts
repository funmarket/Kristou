import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  applyTheme,
  DEFAULT_THEME,
  THEME_TOKENS,
  type ThemeRoot,
} from "../../packages/ui/src/theme/theme.ts";
import {
  applyLocale,
  directionFor,
  translations,
  type LocaleRoot,
} from "../../packages/frontend/src/i18n/index.ts";

test("Light is the default theme even when the operating system prefers dark", () => {
  assert.equal(DEFAULT_THEME, "light");

  const root: ThemeRoot = { dataset: {} };
  applyTheme(root, DEFAULT_THEME);
  assert.equal(root.dataset.theme, "light");
});

test("Pitch Black mode uses a true black application background", () => {
  assert.equal(THEME_TOKENS.dark.background, "#000000");

  const root: ThemeRoot = { dataset: {} };
  applyTheme(root, "dark");
  assert.equal(root.dataset.theme, "dark");
});

test("Arabic uses RTL while French and English use LTR", () => {
  assert.equal(directionFor("ar"), "rtl");
  assert.equal(directionFor("fr"), "ltr");
  assert.equal(directionFor("en"), "ltr");

  const root: LocaleRoot = { lang: "", dir: "" };
  applyLocale(root, "ar");
  assert.deepEqual(root, { lang: "ar", dir: "rtl" });
});

test("shell translation keys exist in all three foundation languages", () => {
  const requiredKeys = [
    "school",
    "notifications",
    "account",
    "appearance",
    "language",
    "light",
    "dark",
    "close",
    "noNotifications",
    "shellHint",
  ] as const;

  for (const locale of ["en", "fr", "ar"] as const) {
    for (const key of requiredKeys) {
      assert.equal(typeof translations[locale][key], "string");
      assert.notEqual(translations[locale][key].trim(), "");
    }
  }
});

test("governed CSS keeps touch scrollbars transparent and desktop scrollbars unobtrusive", async () => {
  const css = await readFile(
    new URL("../../packages/ui/src/theme/global.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /\.k-scroll/);
  assert.match(css, /scrollbar-color:\s*transparent transparent/);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /::-webkit-scrollbar/);
});

test("theme token CSS contains exact pitch-black and white dark-mode values", async () => {
  const css = await readFile(
    new URL("../../packages/ui/src/theme/tokens.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /--k-bg:\s*#000000/);
  assert.match(css, /--k-text:\s*#ffffff/i);
});
