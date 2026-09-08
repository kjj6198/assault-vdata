import { defineConfig } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins:
    mode === "test"
      ? []
      : [
          tailwindcss(),
          tanstackStart(),
          nitro({ preset: "cloudflare_module" }),
          react({ compiler: true }),
        ],
  lint: {
    jsPlugins: ["oxlint-tailwindcss"],
    settings: {
      tailwindcss: { entryPoint: "src/styles.css" },
    },
    plugins: [
      "eslint",
      "typescript",
      "unicorn",
      "oxc",
      "import",
      "promise",
      "react",
      "react-perf",
      "jsx-a11y",
    ],
    ignorePatterns: ["data/**", "src/routeTree.gen.ts", ".output/**"],
    rules: {
      "tailwindcss/no-unknown-classes": "error",
      "tailwindcss/no-duplicate-classes": "error",
      "tailwindcss/no-conflicting-classes": "error",
      "tailwindcss/enforce-canonical": "error",
      "tailwindcss/prefer-scale-token": [
        "error",
        // v1.10.2 suggests rounded-lg for 4px, but our --radius makes rounded-lg 10px.
        { step: 0.25, allow: ["rounded-[4px]"] },
      ],
      "tailwindcss/enforce-sort-order": "error",
      // Native React Compiler diagnostics, aligned with the recommended lint presets.
      "react/error-boundaries": "error",
      "react/globals": "error",
      "react/immutability": "error",
      "react/incompatible-library": "error",
      "react/preserve-manual-memoization": "error",
      "react/purity": "error",
      "react/refs": "error",
      "react/set-state-in-effect": "error",
      "react/set-state-in-render": "error",
      "react/static-components": "error",
      "react/unsupported-syntax": "error",
      "react/use-memo": "error",
      "react/void-use-memo": "error",
      // SVG and canvas have no tag equivalent for `role="button"`, `"group"` or `"img"`.
      "jsx-a11y/prefer-tag-over-role": "off",
      // A scrollable container needs `tabIndex={0}` to stay keyboard reachable (WCAG 2.1.1).
      "jsx-a11y/no-noninteractive-tabindex": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: ["data/**", "src/routeTree.gen.ts", "package-lock.json"],
  },
  test: { include: ["tests/**/*.test.ts"] },
}));
