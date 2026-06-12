import { Prisma, type PrismaClient } from "@prisma/client";
import type { GameState } from "../game/types";
import { getPrisma } from "./prisma";
import type { Lobby } from "./registry";
import type { CompletedGame, CompletedGamePlayer } from "./gameHistory";

export interface PersistedGame {
  lobby: Lobby;
  state: GameState | null;
}

export interface GamePersistence {
  create(game: PersistedGame): Promise<boolean>;
  save(game: PersistedGame): Promise<void>;
  findByGameId(gameId: string): Promise<PersistedGame | undefined>;
  findByJoinCode(joinCode: string): Promise<PersistedGame | undefined>;
  recordResult(result: CompletedGame): Promise<void>;
  listResults(): Promise<CompletedGame[]>;
}

function cloneGame(game: PersistedGame): PersistedGame {
  return structuredClone(game);
}

/** In-memory adapter used by tests and local development without DATABASE_URL. */
export class MemoryGamePersistence implements GamePersistence {
  private games = new Map<string, PersistedGame>();
  private byCode = new Map<string, string>();
  private results = new Map<string, CompletedGame>();

  async create(game: PersistedGame): Promise<boolean> {
    if (this.games.has(game.lobby.gameId) || this.byCode.has(game.lobby.joinCode)) return false;
    this.games.set(game.lobby.gameId, cloneGame(game));
    this.byCode.set(game.lobby.joinCode, game.lobby.gameId);
    return true;
  }

  async save(game: PersistedGame): Promise<void> {
    const previous = this.games.get(game.lobby.gameId);
    if (previous && previous.lobby.joinCode !== game.lobby.joinCode) {
      this.byCode.delete(previous.lobby.joinCode);
    }
    this.games.set(game.lobby.gameId, cloneGame(game));
    this.byCode.set(game.lobby.joinCode, game.lobby.gameId);
  }

  async findByGameId(gameId: string): Promise<PersistedGame | undefined> {
    const game = this.games.get(gameId);
    return game ? cloneGame(game) : undefined;
  }

  async findByJoinCode(joinCode: string): Promise<PersistedGame | undefined> {
    const gameId = this.byCode.get(joinCode.toUpperCase());
    return gameId ? this.findByGameId(gameId) : undefined;
  }

  async recordResult(result: CompletedGame): Promise<void> {
    if (!this.results.has(result.gameId)) this.results.set(result.gameId, structuredClone(result));
  }

  async listResults(): Promise<CompletedGame[]> {
    return Array.from(this.results.values())
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .map((result) => structuredClone(result));
  }
}

/** Prisma adapter. Lobby metadata and settled engine snapshots live as JSONB. */
export class PrismaGamePersistence implements GamePersistence {
  constructor(private prisma: PrismaClient = getPrisma()) {}

  async create(game: PersistedGame): Promise<boolean> {
    try {
      await this.prisma.gameSession.create({
        data: {
          gameId: game.lobby.gameId,
          joinCode: game.lobby.joinCode,
          lobby: game.lobby as unknown as Prisma.InputJsonValue,
          gameState: game.state ? (game.state as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return false;
      }
      throw error;
    }
  }

  async save(game: PersistedGame): Promise<void> {
    const data = {
      joinCode: game.lobby.joinCode,
      lobby: game.lobby as unknown as Prisma.InputJsonValue,
      gameState: game.state ? (game.state as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    };
    await this.prisma.gameSession.upsert({
      where: { gameId: game.lobby.gameId },
      create: { gameId: game.lobby.gameId, ...data },
      update: data,
    });
  }

  async findByGameId(gameId: string): Promise<PersistedGame | undefined> {
    const game = await this.prisma.gameSession.findUnique({ where: { gameId } });
    return game ? this.fromRow(game) : undefined;
  }

  async findByJoinCode(joinCode: string): Promise<PersistedGame | undefined> {
    const game = await this.prisma.gameSession.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
    });
    return game ? this.fromRow(game) : undefined;
  }

  async recordResult(result: CompletedGame): Promise<void> {
    try {
      await this.prisma.gameResult.create({
        data: {
          gameId: result.gameId,
          winnerName: result.winnerName,
          players: result.players as unknown as Prisma.InputJsonValue,
          turnCount: result.turnCount,
          startedAt: new Date(result.startedAt),
          finishedAt: new Date(result.finishedAt),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
      throw error;
    }
  }

  async listResults(): Promise<CompletedGame[]> {
    const results = await this.prisma.gameResult.findMany({ orderBy: { finishedAt: "desc" } });
    return results.map((result) => ({
      gameId: result.gameId,
      winnerName: result.winnerName,
      players: result.players as unknown as CompletedGamePlayer[],
      turnCount: result.turnCount,
      startedAt: result.startedAt.getTime(),
      finishedAt: result.finishedAt.getTime(),
    }));
  }

  private fromRow(row: {
    lobby: Prisma.JsonValue;
    gameState: Prisma.JsonValue | null;
  }): PersistedGame {
    return {
      lobby: row.lobby as unknown as Lobby,
      state: row.gameState === null ? null : (row.gameState as unknown as GameState),
    };
  }
}

export function createGamePersistence(): GamePersistence {
  if (process.env.DATABASE_URL) return new PrismaGamePersistence();

  console.warn("DATABASE_URL is not set; game sessions will only persist in memory.");
  return new MemoryGamePersistence();
}
