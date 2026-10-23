import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Component tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
  test: { include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
});
