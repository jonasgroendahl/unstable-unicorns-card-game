// Standalone Vitest config for the pure game-engine and registry tests.
// Intentionally does NOT load the app plugins (Nitro/TanStack Start), which are
// not needed for the engine logic and break Vitest's dev-server startup.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/game/**/*.test.ts", "src/lib/**/*.test.ts", "src/server/registry.test.ts"],
  },
});
