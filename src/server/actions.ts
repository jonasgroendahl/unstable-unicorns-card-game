// Server functions: lobby management + game commands. All state lives in the
// process-global registry (in-memory). Commands route to the live GameEngine.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { registry } from "./registry";
import { sanitizeFor } from "../game/view";

// --- Lobby ----------------------------------------------------------------

export const createLobby = createServerFn({ method: "POST" })
  .validator(z.object({ hostName: z.string().min(1).max(20) }))
  .handler(async ({ data }) => {
    const lobby = registry.createLobby(data.hostName);
    return { gameId: lobby.gameId, joinCode: lobby.joinCode, youId: lobby.hostId };
  });

export const joinLobby = createServerFn({ method: "POST" })
  .validator(z.object({ joinCode: z.string().min(3).max(8), name: z.string().min(1).max(20) }))
  .handler(async ({ data }) => {
    const lobby = registry.getByCode(data.joinCode);
    if (!lobby) throw new Error("Lobby not found.");
    const seat = registry.joinLobby(lobby.gameId, data.name);
    if (!seat) throw new Error("Could not join (lobby full or already started).");
    return { gameId: lobby.gameId, youId: seat.id };
  });

export const getLobby = createServerFn({ method: "GET" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    const lobby = registry.getLobby(data.gameId);
    if (!lobby) throw new Error("Lobby not found.");
    return lobby;
  });

export const addBotToLobby = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    registry.addBot(data.gameId);
    return registry.getLobby(data.gameId);
  });

export const removeSeat = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), seatId: z.string() }))
  .handler(async ({ data }) => {
    registry.removeSeat(data.gameId, data.seatId);
    return registry.getLobby(data.gameId);
  });

export const startGame = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ data }) => {
    const ok = registry.startGame(data.gameId);
    if (!ok) throw new Error("Could not start (need at least 2 players).");
    return { ok: true };
  });

// --- Game state snapshot (fallback / initial load) ------------------------

export const getGameView = createServerFn({ method: "GET" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    return sanitizeFor(engine.state, data.playerId);
  });

// --- Commands -------------------------------------------------------------

export const playCard = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string(), instanceId: z.string() }))
  .handler(async ({ data }) => {
    const engine = registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.playCard(data.playerId, data.instanceId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const drawForTurn = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.drawForTurn(data.playerId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

export const endTurn = createServerFn({ method: "POST" })
  .validator(z.object({ gameId: z.string(), playerId: z.string() }))
  .handler(async ({ data }) => {
    const engine = registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      await engine.endTurn(data.playerId);
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
    const engine = registry.getEngine(data.gameId);
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
    const engine = registry.getEngine(data.gameId);
    if (!engine) throw new Error("Game not active.");
    try {
      engine.submitReaction(data.playerId, data.instanceId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });
