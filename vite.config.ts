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
