import { expect, it, vi } from "vitest";
import { MemoryGamePersistence } from "./persistence";
import { createRegistryStore, Registry } from "./registry";

it("refreshes registry code while preserving cached game data across module reloads", async () => {
  const firstModule = await import("./registry");
  const lobby = await firstModule.registry.createLobby("Alice");

  vi.resetModules();
  const refreshedModule = await import("./registry");

  expect(refreshedModule.registry).not.toBe(firstModule.registry);
  expect(await refreshedModule.registry.getLobby(lobby.gameId)).toEqual(lobby);
});

it("loads a persisted lobby and join code into a fresh registry", async () => {
  const persistence = new MemoryGamePersistence();
  const first = new Registry(createRegistryStore(persistence));
  const lobby = await first.createLobby("Alice");
  const seat = await first.joinLobby(lobby.gameId, "Bob");

  const restarted = new Registry(createRegistryStore(persistence));

  expect(await restarted.getLobby(lobby.gameId)).toMatchObject({
    gameId: lobby.gameId,
    seats: [{ name: "Alice" }, { name: "Bob" }],
  });
  expect(await restarted.getByCode(lobby.joinCode)).toMatchObject({ gameId: lobby.gameId });
  expect(seat?.name).toBe("Bob");
});

it("hydrates an active game from its latest settled snapshot", async () => {
  const persistence = new MemoryGamePersistence();
  const first = new Registry(createRegistryStore(persistence));
  const lobby = await first.createLobby("Alice");
  await first.joinLobby(lobby.gameId, "Bob");
  await first.startGame(lobby.gameId);

  const firstEngine = await first.getEngine(lobby.gameId);
  await vi.waitFor(() => expect(firstEngine?.state.phase).toBe("action"));
  await first.flush(lobby.gameId);

  const restarted = new Registry(createRegistryStore(persistence));
  const restoredEngine = await restarted.getEngine(lobby.gameId);
  await vi.waitFor(() => expect(restoredEngine?.state.phase).toBe("action"));

  expect(restoredEngine).not.toBe(firstEngine);
  expect(restoredEngine?.state.gameId).toBe(lobby.gameId);
  expect(restoredEngine?.state.players.map((player) => player.name)).toEqual(["Alice", "Bob"]);

  const highestLogSequence = Math.max(
    ...(restoredEngine?.state.log.map((event) => event.t) ?? [0]),
  );
  await restoredEngine?.endTurn(restoredEngine.currentPlayerId());
  expect(restoredEngine?.state.log.at(-1)?.t).toBeGreaterThan(highestLogSequence);
});
