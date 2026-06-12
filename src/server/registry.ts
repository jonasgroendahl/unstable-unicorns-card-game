// Process-local live game engines backed by durable, settled snapshots.
//
// The engine and SSE subscribers stay in memory. Lobby metadata and snapshots
// with no live decision/reaction promise are persisted so games survive restarts.

import { runBots } from "../game/ai/bot";
import { GameEngine } from "../game/engine/GameEngine";
import { makeGameId, makeJoinCode } from "../game/ids";
import { createGame } from "../game/index";
import type { GameState } from "../game/types";
import { DEFAULT_DECK_ID, type DeckId } from "../game/decks";
import { createGamePersistence, type GamePersistence, type PersistedGame } from "./persistence";
import { buildGameHistoryData, type CompletedGame, type GameHistoryData } from "./gameHistory";

export interface LobbySeat {
  id: string;
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
  deckId: DeckId;
  createdAt: number;
}

interface GameRecord {
  lobby: Lobby;
  engine?: GameEngine;
  /** SSE subscribers, keyed by a connection id. */
  subscribers: Map<string, (state: GameState) => void>;
  persistChain: Promise<void>;
  persistenceError?: unknown;
}

export interface RegistryStore {
  games: Map<string, GameRecord>;
  byCode: Map<string, string>;
  loads: Map<string, Promise<GameRecord | undefined>>;
  persistence: GamePersistence;
}

export function createRegistryStore(persistence = createGamePersistence()): RegistryStore {
  return {
    games: new Map(),
    byCode: new Map(),
    loads: new Map(),
    persistence,
  };
}

export class Registry {
  constructor(private store: RegistryStore) {}

  async createLobby(hostName: string, deckId: DeckId = DEFAULT_DECK_ID): Promise<Lobby> {
    const normalizedHostName = hostName.trim();
    if (!normalizedHostName) throw new Error("A host name is required.");

    for (let attempt = 0; attempt < 20; attempt++) {
      const gameId = makeGameId();
      const joinCode = makeJoinCode();
      if (this.store.byCode.has(joinCode)) continue;

      const hostId = `p_${gameId}_0`;
      const lobby: Lobby = {
        gameId,
        joinCode,
        hostId,
        seats: [{ id: hostId, name: normalizedHostName, isBot: false, connected: true }],
        status: "lobby",
        deckId,
        createdAt: Date.now(),
      };
      const created = await this.store.persistence.create({ lobby, state: null });
      if (!created) continue;

      this.cacheRecord({ lobby, subscribers: new Map(), persistChain: Promise.resolve() });
      return lobby;
    }
    throw new Error("Could not allocate a unique game id and join code.");
  }

  async getLobby(gameId: string): Promise<Lobby | undefined> {
    return (await this.getRecord(gameId))?.lobby;
  }

  async getByCode(code: string): Promise<Lobby | undefined> {
    const normalized = code.toUpperCase();
    const cachedId = this.store.byCode.get(normalized);
    if (cachedId) return this.getLobby(cachedId);

    const persisted = await this.store.persistence.findByJoinCode(normalized);
    return persisted ? this.hydrate(persisted).lobby : undefined;
  }

  async joinLobby(gameId: string, name: string): Promise<LobbySeat | undefined> {
    const rec = await this.getRecord(gameId);
    if (!rec || rec.lobby.status !== "lobby" || rec.lobby.seats.length >= 8) return undefined;

    const seat: LobbySeat = {
      id: `p_${gameId}_${rec.lobby.seats.length}`,
      name: name || `Player ${rec.lobby.seats.length + 1}`,
      isBot: false,
      connected: true,
    };
    rec.lobby.seats.push(seat);
    await this.persistAndFlush(rec);
    return seat;
  }

  async addBot(gameId: string): Promise<LobbySeat | undefined> {
    const rec = await this.getRecord(gameId);
    if (!rec || rec.lobby.status !== "lobby" || rec.lobby.seats.length >= 8) return undefined;

    const botNum = rec.lobby.seats.filter((s) => s.isBot).length + 1;
    const seat: LobbySeat = {
      id: `p_${gameId}_${rec.lobby.seats.length}`,
      name: `Bot ${botNum}`,
      isBot: true,
      connected: true,
    };
    rec.lobby.seats.push(seat);
    await this.persistAndFlush(rec);
    return seat;
  }

  async removeSeat(gameId: string, seatId: string): Promise<void> {
    const rec = await this.getRecord(gameId);
    if (!rec || rec.lobby.status !== "lobby") return;

    rec.lobby.seats = rec.lobby.seats.filter((s) => s.id !== seatId);
    await this.persistAndFlush(rec);
  }

  async setLobbyDeck(gameId: string, playerId: string, deckId: DeckId): Promise<Lobby | undefined> {
    const rec = await this.getRecord(gameId);
    if (!rec || rec.lobby.status !== "lobby" || rec.lobby.hostId !== playerId) return undefined;

    rec.lobby.deckId = deckId;
    await this.persistAndFlush(rec);
    return rec.lobby;
  }

  async startGame(gameId: string): Promise<boolean> {
    const rec = await this.getRecord(gameId);
    if (!rec || rec.lobby.status !== "lobby" || rec.lobby.seats.length < 2) return false;

    rec.engine = createGame({
      gameId,
      deckId: rec.lobby.deckId,
      seats: rec.lobby.seats.map((s) => ({ id: s.id, name: s.name, isBot: s.isBot })),
    });
    rec.lobby.status = "active";
    this.wireEngine(rec);
    this.queuePersist(rec, rec.engine.state);
    await this.flush(gameId);

    for (const fn of rec.subscribers.values()) fn(rec.engine.state);
    return true;
  }

  async getEngine(gameId: string): Promise<GameEngine | undefined> {
    return (await this.getRecord(gameId))?.engine;
  }

  async getGameHistory(): Promise<GameHistoryData> {
    return buildGameHistoryData(await this.store.persistence.listResults());
  }

  subscribe(gameId: string, connId: string, fn: (state: GameState) => void): () => void {
    const rec = this.store.games.get(gameId);
    if (!rec) return () => {};

    rec.subscribers.set(connId, fn);
    return () => {
      rec.subscribers.delete(connId);
    };
  }

  async flush(gameId: string): Promise<void> {
    const rec = this.store.games.get(gameId);
    if (!rec) return;

    await rec.persistChain;
    if (rec.persistenceError) {
      const error = rec.persistenceError;
      rec.persistenceError = undefined;
      throw error;
    }
  }

  /** Nudge bots after a human action that may unblock one. */
  async nudgeBots(gameId: string): Promise<void> {
    const engine = await this.getEngine(gameId);
    if (engine) runBots(engine);
  }

  private async getRecord(gameId: string): Promise<GameRecord | undefined> {
    const cached = this.store.games.get(gameId);
    if (cached) {
      this.ensureDeckId(cached);
      return cached;
    }

    const existingLoad = this.store.loads.get(gameId);
    if (existingLoad) return existingLoad;

    const load = this.store.persistence
      .findByGameId(gameId)
      .then((persisted) => (persisted ? this.hydrate(persisted) : undefined))
      .finally(() => this.store.loads.delete(gameId));
    this.store.loads.set(gameId, load);
    return load;
  }

  private hydrate(persisted: PersistedGame): GameRecord {
    const existing = this.store.games.get(persisted.lobby.gameId);
    if (existing) return existing;

    persisted.lobby.deckId ??= DEFAULT_DECK_ID;
    if (persisted.state) persisted.state.deckId ??= persisted.lobby.deckId;

    const rec: GameRecord = {
      lobby: persisted.lobby,
      subscribers: new Map(),
      persistChain: Promise.resolve(),
    };
    if (persisted.state) {
      // Only settled snapshots are written, so no unresolved promise-backed
      // decision or reaction should be present after hydration.
      persisted.state.pendingDecisions = [];
      persisted.state.reaction = null;
      rec.engine = new GameEngine(persisted.state);
      rec.engine.onBotTurn = () => runBots(rec.engine!);
      this.wireEngine(rec);
    }
    this.cacheRecord(rec);
    if (persisted.state?.status === "finished") this.queuePersist(rec, persisted.state);
    this.resumeEngine(rec);
    return rec;
  }

  private cacheRecord(rec: GameRecord): void {
    this.ensureDeckId(rec);
    this.store.games.set(rec.lobby.gameId, rec);
    this.store.byCode.set(rec.lobby.joinCode, rec.lobby.gameId);
  }

  private ensureDeckId(rec: GameRecord): void {
    rec.lobby.deckId ??= DEFAULT_DECK_ID;
    if (rec.engine) rec.engine.state.deckId ??= rec.lobby.deckId;
  }

  private wireEngine(rec: GameRecord): void {
    rec.engine?.subscribe((state) => {
      for (const fn of rec.subscribers.values()) fn(state);
      if (state.status === "finished") rec.lobby.status = "finished";
      if (this.isSettled(state)) this.queuePersist(rec, state);
    });
  }

  private resumeEngine(rec: GameRecord): void {
    const engine = rec.engine;
    if (!engine || engine.state.status !== "active") return;

    // Beginning/end are transient phases that had just broadcast before their
    // async work. Re-enter them; action phase is already ready for commands.
    if (engine.state.phase === "beginning" || engine.state.phase === "draw") {
      void engine.startTurn().catch((error) => console.error("Could not resume game turn", error));
    } else if (engine.state.phase === "end") {
      void engine
        .endTurn(engine.currentPlayerId())
        .catch((error) => console.error("Could not resume game end phase", error));
    } else {
      runBots(engine);
    }
  }

  private isSettled(state: GameState): boolean {
    return state.pendingDecisions.length === 0 && state.reaction === null;
  }

  private async persistAndFlush(rec: GameRecord): Promise<void> {
    this.queuePersist(rec, rec.engine?.state ?? null);
    await this.flush(rec.lobby.gameId);
  }

  private queuePersist(rec: GameRecord, state: GameState | null): void {
    const snapshot: PersistedGame = {
      lobby: structuredClone(rec.lobby),
      state: state ? structuredClone(state) : null,
    };
    const result = this.completedGameFor(snapshot);
    rec.persistChain = rec.persistChain.then(async () => {
      try {
        await this.store.persistence.save(snapshot);
        if (result) await this.store.persistence.recordResult(result);
        rec.persistenceError = undefined;
      } catch (error) {
        rec.persistenceError = error;
        console.error(`Could not persist game ${rec.lobby.gameId}`, error);
      }
    });
  }

  private completedGameFor(game: PersistedGame): CompletedGame | null {
    const state = game.state;
    if (!state || state.status !== "finished" || !state.winnerId) return null;
    if (state.players.some((player) => player.isBot)) return null;

    const winner = state.players.find((player) => player.id === state.winnerId);
    if (!winner) return null;

    return {
      gameId: state.gameId,
      winnerName: winner.name,
      players: state.players.map((player) => ({
        name: player.name,
        won: player.id === state.winnerId,
      })),
      turnCount: state.turnNumber,
      startedAt: game.lobby.createdAt,
      finishedAt: Date.now(),
    };
  }
}

// Preserve cached engines and fallback memory persistence across HMR while
// recreating Registry methods from the latest server code.
const g = globalThis as unknown as { __uuRegistryStore?: RegistryStore };
const store = g.__uuRegistryStore ?? createRegistryStore();
g.__uuRegistryStore = store;
export const registry = new Registry(store);
