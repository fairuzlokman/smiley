import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Each file gets its own module registry, so the in-memory DB singleton is per file.
    fileParallelism: true,
  },
});
