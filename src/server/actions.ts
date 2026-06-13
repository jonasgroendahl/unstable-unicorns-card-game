// Server functions: lobby management + game commands. Commands route to the
// process-local live GameEngine; settled snapshots are persisted by the registry.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { registry } from "./registry";
import { sanitizeFor } from "../game/view";
import { DECK_IDS } from "../game/decks";

// --- Lobby ----------------------------------------------------------------

export const createLobby = createServerFn({ method: "POST" })
  .validator(
    z.object({
      hostName: z.string().trim().min(1).max(20),
      deckId: z.enum(DECK_IDS).default("base-first-edition"),
    }),
  )
  .handler(async ({ data }) => {
    const lobby = await registry.createLobby(data.hostName, data.deckId);
    return { gameId: lobby.gameId, joinCode: lobby.joinCode, youId: lobby.hostId };
  });

export const joinLobby = createServerFn({ method: "POST" })
  .validator(z.object({ joinCode: z.string().min(3).max(8), name: z.string().min(1).max(20) }))
  .handler(async ({ data }) => {
    const lobby = await registry.getByCode(data.joinCode);
    if (!lobby) throw new Error("Lobby not found.");
    const seat = await registry.joinLobby(lobby.gameId, data.name);
    if (!seat) throw new Error("Could not join (lobby full or already started).");
    return { gameId: lobby.gameId, youId: seat.id };
  });

export const getLobby = createServerFn({ method: "GET" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    const lobby = await registry.getLobby(data.gameId);
    if (!lobby) throw new Error("Lobby not found.");
    return lobby;
  });

export const getGameHistory = createServerFn({ method: "GET" }).handler(() =>
  registry.getGameHistory(),
);

export const joinMatchmakingQueue = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().trim().min(1).max(20) }))
  .handler(({ data }) => registry.joinMatchmaking(data.name));

export const getMatchmakingStatus = createServerFn({ method: "POST" })
  .validator(z.object({ ticketId: z.string().min(1) }))
  .handler(({ data }) => registry.getMatchmakingStatus(data.ticketId));

export const leaveMatchmakingQueue = createServerFn({ method: "POST" })
  .validator(z.object({ ticketId: z.string().min(1) }))
  .handler(({ data }) => registry.leaveMatchmaking(data.ticketId));

export const addBotToLobby = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    await registry.addBot(data.gameId);
    return registry.getLobby(data.gameId);
  });

export const removeSeat = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), seatId: z.string() }))
  .handler(async ({ data }) => {
    await registry.removeSeat(data.gameId, data.seatId);
    return registry.getLobby(data.gameId);
  });

export const setLobbyDeck = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string(), deckId: z.enum(DECK_IDS) }))
  .handler(async ({ data }) => {
    const lobby = await registry.setLobbyDeck(data.gameId, data.playerId, data.deckId);
    if (!lobby) throw new Error("Only the host can change the deck before the game starts.");
    return lobby;
  });

export const startGame = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    const ok = await registry.startGame(data.gameId);
    if (!ok) throw new Error("Could not start (need at least 2 players).");
    return { ok: true };
  });

// --- Game state snapshot (fallback / initial load) ------------------------

export const getGameView = createServerFn({ method: "GET" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    return sanitizeFor(engine.state, data.playerId);
  });

// --- Commands -------------------------------------------------------------

export const playCard = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string(), instanceId: z.string() }))
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.playCard(data.playerId, data.instanceId);
      await registry.flush(data.gameId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const drawForTurn = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.drawForTurn(data.playerId);
      await registry.flush(data.gameId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const endTurn = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.endTurn(data.playerId);
      await registry.flush(data.gameId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const resolveDecision = createServerFn({ method: "POST" })
  .validator(
    z.object({
      gameId: z.string(),
      playerId: z.string(),
      value: z.union([z.string(), z.array(z.string()), z.boolean(), z.null()]),
    }),
  )
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      engine.submitDecision(data.playerId, data.value);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const playReaction = createServerFn({ method: "POST" })
  .validator(
    z.object({ gameId: z.string(), playerId: z.string(), instanceId: z.string().nullable() }),
  )
  .handler(async ({ data }) => {
    const engine = await registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      engine.submitReaction(data.playerId, data.instanceId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });
