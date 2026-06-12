// Process-global in-memory store of lobbies and live game engines.
//
// This requires a single long-lived Node process (the Nitro dev server and a
// standard node deploy both satisfy this). Games are lost on restart — acceptable
// for this build per the plan.

import { GameEngine } from "../game/engine/GameEngine";
import { createGame } from "../game/index";
import { runBots } from "../game/ai/bot";
import { makeGameId, makeJoinCode } from "../game/ids";
import type { GameState } from "../game/types";

export interface LobbySeat {
  id: string; // player id
  name: string;
  isBot: boolean;
  connected: boolean;
}

export interface Lobby {
  gameId: string;
  joinCode: string;
  hostId: string;
  seats: LobbySeat[];
  status: "lobby" | "active" | "finished";
  createdAt: number;
}

interface GameRecord {
  lobby: Lobby;
  engine?: GameEngine;
  /** SSE subscribers, keyed by a connection id. */
  subscribers: Map<string, (state: GameState) => void>;
}

interface RegistryStore {
  games: Map<string, GameRecord>;
  byCode: Map<string, string>;
}

class Registry {
  private games: Map<string, GameRecord>;
  private byCode: Map<string, string>;

  constructor(store: RegistryStore) {
    this.games = store.games;
    this.byCode = store.byCode;
  }

  createLobby(hostName: string): Lobby {
    const gameId = makeGameId();
    let joinCode = makeJoinCode();
    while (this.byCode.has(joinCode)) joinCode = makeJoinCode();
    const hostId = `p_${gameId}_0`;
    const lobby: Lobby = {
      gameId,
      joinCode,
      hostId,
      seats: [{ id: hostId, name: hostName || "Host", isBot: false, connected: true }],
      status: "lobby",
      createdAt: Date.now(),
    };
    this.games.set(gameId, { lobby, subscribers: new Map() });
    this.byCode.set(joinCode, gameId);
    return lobby;
  }

  getLobby(gameId: string): Lobby | undefined {
    return this.games.get(gameId)?.lobby;
  }

  getByCode(code: string): Lobby | undefined {
    const id = this.byCode.get(code.toUpperCase());
    return id ? this.getLobby(id) : undefined;
  }

  joinLobby(gameId: string, name: string): LobbySeat | undefined {
    const rec = this.games.get(gameId);
    if (!rec || rec.lobby.status !== "lobby") return undefined;
    if (rec.lobby.seats.length >= 8) return undefined;
    const seat: LobbySeat = {
      id: `p_${gameId}_${rec.lobby.seats.length}`,
      name: name || `Player ${rec.lobby.seats.length + 1}`,
      isBot: false,
      connected: true,
    };
    rec.lobby.seats.push(seat);
    this.broadcastLobby(gameId);
    return seat;
  }

  addBot(gameId: string): LobbySeat | undefined {
    const rec = this.games.get(gameId);
    if (!rec || rec.lobby.status !== "lobby" || rec.lobby.seats.length >= 8) return undefined;
    const botNum = rec.lobby.seats.filter((s) => s.isBot).length + 1;
    const seat: LobbySeat = {
      id: `p_${gameId}_${rec.lobby.seats.length}`,
      name: `Bot ${botNum}`,
      isBot: true,
      connected: true,
    };
    rec.lobby.seats.push(seat);
    this.broadcastLobby(gameId);
    return seat;
  }

  removeSeat(gameId: string, seatId: string) {
    const rec = this.games.get(gameId);
    if (!rec || rec.lobby.status !== "lobby") return;
    rec.lobby.seats = rec.lobby.seats.filter((s) => s.id !== seatId);
    this.broadcastLobby(gameId);
  }

  startGame(gameId: string): boolean {
    const rec = this.games.get(gameId);
    if (!rec || rec.lobby.status !== "lobby") return false;
    if (rec.lobby.seats.length < 2) return false;
    rec.engine = createGame({
      gameId,
      seats: rec.lobby.seats.map((s) => ({ id: s.id, name: s.name, isBot: s.isBot })),
    });
    rec.lobby.status = "active";
    // Re-broadcast game state to SSE subscribers on every engine change.
    rec.engine.subscribe((state) => {
      for (const fn of rec.subscribers.values()) fn(state);
      if (state.status === "finished") rec.lobby.status = "finished";
    });
    // Push an initial frame.
    for (const fn of rec.subscribers.values()) fn(rec.engine.state);
    return true;
  }

  getEngine(gameId: string): GameEngine | undefined {
    return this.games.get(gameId)?.engine;
  }

  subscribe(gameId: string, connId: string, fn: (state: GameState) => void): () => void {
    const rec = this.games.get(gameId);
    if (!rec) return () => {};
    rec.subscribers.set(connId, fn);
    return () => {
      rec.subscribers.delete(connId);
    };
  }

  /** Re-emit current engine state (used right after a subscribe). */
  pushCurrent(gameId: string) {
    const rec = this.games.get(gameId);
    if (rec?.engine) for (const fn of rec.subscribers.values()) fn(rec.engine.state);
  }

  private broadcastLobby(_gameId: string) {
    // Lobby updates are polled by clients via getLobby; SSE only carries game state.
  }

  /** Nudge bots (called after a human action that may unblock a bot). */
  nudgeBots(gameId: string) {
    const engine = this.getEngine(gameId);
    if (engine) runBots(engine);
  }
}

// Persist game data across HMR, while recreating the Registry so its methods and
// imported engine factory always use the latest server code.
const g = globalThis as unknown as { __uuRegistryStore?: RegistryStore };
const store: RegistryStore = g.__uuRegistryStore ?? {
  games: new Map(),
  byCode: new Map(),
};
g.__uuRegistryStore = store;
export const registry = new Registry(store);
