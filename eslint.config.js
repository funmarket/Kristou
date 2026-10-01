import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", ".superpowers/**"],
  },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-debugger": "error",
    },
  },
);
