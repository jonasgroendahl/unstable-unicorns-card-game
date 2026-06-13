import { expect, it, vi } from "vitest";
import { MemoryGamePersistence } from "./persistence";
import { createRegistryStore, MATCHMAKING_STALE_AFTER_MS, Registry } from "./registry";

it("refreshes registry code while preserving cached game data across module reloads", async () => {
  const firstModule = await import("./registry");
  const lobby = await firstModule.registry.createLobby("Alice");

  vi.resetModules();
  const refreshedModule = await import("./registry");

  expect(refreshedModule.registry).not.toBe(firstModule.registry);
  expect(await refreshedModule.registry.getLobby(lobby.gameId)).toEqual(lobby);
});

it("requires a non-blank host name when creating a lobby", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));

  await expect(registry.createLobby("   ")).rejects.toThrow("A host name is required.");
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

it("persists the selected deck and starts the game with it", async () => {
  const persistence = new MemoryGamePersistence();
  const registry = new Registry(createRegistryStore(persistence));
  const lobby = await registry.createLobby("Alice", "base-second-edition");
  await registry.joinLobby(lobby.gameId, "Bob");
  await registry.startGame(lobby.gameId);

  expect((await registry.getLobby(lobby.gameId))?.deckId).toBe("base-second-edition");
  expect((await registry.getEngine(lobby.gameId))?.state.deckId).toBe("base-second-edition");
});

it("lets only the host change the lobby deck before the game starts", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));
  const lobby = await registry.createLobby("Alice");
  const bob = await registry.joinLobby(lobby.gameId, "Bob");

  expect(await registry.setLobbyDeck(lobby.gameId, bob!.id, "base-second-edition")).toBeUndefined();
  expect(
    (await registry.setLobbyDeck(lobby.gameId, lobby.hostId, "base-second-edition"))?.deckId,
  ).toBe("base-second-edition");
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

it("records completed all-human games once", async () => {
  const persistence = new MemoryGamePersistence();
  const registry = new Registry(createRegistryStore(persistence));
  const lobby = await registry.createLobby("Alice");
  await registry.joinLobby(lobby.gameId, "Bob");
  await registry.startGame(lobby.gameId);

  const engine = await registry.getEngine(lobby.gameId);
  await vi.waitFor(() => expect(engine?.state.phase).toBe("action"));
  engine!.state.status = "finished";
  engine!.state.winnerId = engine!.state.players[0].id;
  (engine as unknown as { broadcast: () => void }).broadcast();
  (engine as unknown as { broadcast: () => void }).broadcast();
  await registry.flush(lobby.gameId);

  expect(await registry.getGameHistory()).toMatchObject({
    leaderboard: [
      { name: "Alice", games: 1, wins: 1 },
      { name: "Bob", games: 1, wins: 0 },
    ],
    games: [{ gameId: lobby.gameId, winnerName: "Alice" }],
  });
});

it("does not record games containing bots", async () => {
  const persistence = new MemoryGamePersistence();
  const registry = new Registry(createRegistryStore(persistence));
  const lobby = await registry.createLobby("Alice");
  await registry.addBot(lobby.gameId);
  await registry.startGame(lobby.gameId);

  const engine = await registry.getEngine(lobby.gameId);
  engine!.state.status = "finished";
  engine!.state.winnerId = engine!.state.players[0].id;
  (engine as unknown as { broadcast: () => void }).broadcast();
  await registry.flush(lobby.gameId);

  expect(await registry.getGameHistory()).toEqual({ leaderboard: [], games: [] });
});

it("honestly reports when nobody else is in the matchmaking queue", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));

  const status = await registry.joinMatchmaking("Alice");

  expect(status).toMatchObject({
    status: "waiting",
    playersWaiting: 1,
    otherPlayersWaiting: 0,
    matchSize: 4,
  });
});

it("reports other active players while the matchmaking queue is filling", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));
  const alice = await registry.joinMatchmaking("Alice");
  const bob = await registry.joinMatchmaking("Bob");

  expect(bob).toMatchObject({ playersWaiting: 2, otherPlayersWaiting: 1 });
  expect(await registry.getMatchmakingStatus(alice.ticketId)).toMatchObject({
    playersWaiting: 2,
    otherPlayersWaiting: 1,
  });
});

it("starts an all-human game when exactly four matchmaking players are queued", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));
  const joined = await Promise.all(
    ["Alice", "Bob", "Carol", "Dave"].map((name) => registry.joinMatchmaking(name)),
  );
  const statuses = await Promise.all(
    joined.map((ticket) => registry.getMatchmakingStatus(ticket.ticketId)),
  );

  expect(statuses.every((status) => status.status === "matched")).toBe(true);
  expect(new Set(statuses.map((status) => status.gameId)).size).toBe(1);

  const gameId = statuses[0].gameId!;
  expect(await registry.getLobby(gameId)).toMatchObject({
    status: "active",
    seats: [
      { name: "Alice", isBot: false },
      { name: "Bob", isBot: false },
      { name: "Carol", isBot: false },
      { name: "Dave", isBot: false },
    ],
  });
  expect((await registry.getEngine(gameId))?.state.players).toHaveLength(4);
});

it("removes players who leave or stop heartbeating from the matchmaking count", async () => {
  const registry = new Registry(createRegistryStore(new MemoryGamePersistence()));
  let now = 1_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);

  const alice = await registry.joinMatchmaking("Alice");
  const bob = await registry.joinMatchmaking("Bob");
  await registry.leaveMatchmaking(bob.ticketId);

  expect(await registry.getMatchmakingStatus(alice.ticketId)).toMatchObject({
    playersWaiting: 1,
    otherPlayersWaiting: 0,
  });

  now += MATCHMAKING_STALE_AFTER_MS + 1;
  expect(await registry.getMatchmakingStatus(alice.ticketId)).toMatchObject({
    status: "not_found",
    playersWaiting: 0,
    otherPlayersWaiting: 0,
  });
});
