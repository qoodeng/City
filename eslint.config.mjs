import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled Electron output
    "dist-electron/**",
    // Scripts (CommonJS)
    "scripts/**",
  ]),
  // Electron source: allow require() and any (Electron IPC API requires it)
  {
    files: ["src/electron/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Test files: allow any for mocks/helpers
  {
    files: ["src/test/**/*.ts", "src/test/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // E2E fixtures: Playwright's use() is not a React hook
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["src/components/issues/issue-create-dialog.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
