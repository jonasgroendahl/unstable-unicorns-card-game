export interface CompletedGamePlayer {
  name: string;
  won: boolean;
}

export interface CompletedGame {
  gameId: string;
  winnerName: string;
  players: CompletedGamePlayer[];
  turnCount: number;
  startedAt: number;
  finishedAt: number;
}

export interface LeaderboardEntry {
  name: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface GameHistoryData {
  leaderboard: LeaderboardEntry[];
  games: CompletedGame[];
}

function playerKey(name: string): string {
  return name.trim().toLowerCase();
}

export function buildGameHistoryData(games: CompletedGame[]): GameHistoryData {
  const byPlayer = new Map<string, Omit<LeaderboardEntry, "losses" | "winRate">>();

  for (const game of games) {
    for (const player of game.players) {
      const key = playerKey(player.name);
      const entry = byPlayer.get(key) ?? { name: player.name.trim(), games: 0, wins: 0 };
      entry.games += 1;
      if (player.won) entry.wins += 1;
      byPlayer.set(key, entry);
    }
  }

  const leaderboard = Array.from(
    byPlayer.values(),
    (entry): LeaderboardEntry => ({
      ...entry,
      losses: entry.games - entry.wins,
      winRate: entry.games === 0 ? 0 : entry.wins / entry.games,
    }),
  ).sort(
    (a, b) =>
      b.wins - a.wins || b.winRate - a.winRate || b.games - a.games || a.name.localeCompare(b.name),
  );

  return { leaderboard, games };
}
