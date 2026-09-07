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
      : [tailwindcss(), tanstackStart(), nitro({ preset: "node-server" }), react()],
  fmt: { ignorePatterns: ["data/**", "src/routeTree.gen.ts", "package-lock.json"] },
  test: { include: ["tests/**/*.test.ts"] },
}));
