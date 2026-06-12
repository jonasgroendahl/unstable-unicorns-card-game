import { Prisma, type PrismaClient } from "@prisma/client";
import type { GameState } from "../game/types";
import { getPrisma } from "./prisma";
import type { Lobby } from "./registry";

export interface PersistedGame {
  lobby: Lobby;
  state: GameState | null;
}

export interface GamePersistence {
  create(game: PersistedGame): Promise<boolean>;
  save(game: PersistedGame): Promise<void>;
  findByGameId(gameId: string): Promise<PersistedGame | undefined>;
  findByJoinCode(joinCode: string): Promise<PersistedGame | undefined>;
}

function cloneGame(game: PersistedGame): PersistedGame {
  return structuredClone(game);
}

/** In-memory adapter used by tests and local development without DATABASE_URL. */
export class MemoryGamePersistence implements GamePersistence {
  private games = new Map<string, PersistedGame>();
  private byCode = new Map<string, string>();

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
