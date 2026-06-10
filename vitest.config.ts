// saas/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Désactive PostCSS parent (FUSE) — package logique uniquement.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prisma/client": path.resolve(__dirname, "./tests/__mocks__/prisma-client.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/features/**/*.ts",
        "src/lib/billing/**/*.ts",
        "src/server/actions/onboarding.ts",
      ],
      exclude: ["**/*.d.ts", "**/types.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
