import { expect, it, vi } from "vitest";

it("refreshes registry code while preserving game data across module reloads", async () => {
  const firstModule = await import("./registry");
  const lobby = firstModule.registry.createLobby("Alice");

  vi.resetModules();
  const refreshedModule = await import("./registry");

  expect(refreshedModule.registry).not.toBe(firstModule.registry);
  expect(refreshedModule.registry.getLobby(lobby.gameId)).toEqual(lobby);
});
