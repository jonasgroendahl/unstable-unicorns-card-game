// Standalone Vitest config for the pure game-engine tests under src/game.
// Intentionally does NOT load the app plugins (Nitro/TanStack Start), which are
// not needed for the engine logic and break Vitest's dev-server startup.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/game/**/*.test.ts"],
  },
});
