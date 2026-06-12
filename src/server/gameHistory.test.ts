import { expect, it } from "vitest";
import { buildGameHistoryData, type CompletedGame } from "./gameHistory";

const games: CompletedGame[] = [
  {
    gameId: "new",
    winnerName: "alice",
    players: [
      { name: "alice", won: true },
      { name: "Charlie", won: false },
    ],
    turnCount: 12,
    startedAt: 2,
    finishedAt: 3,
  },
  {
    gameId: "old",
    winnerName: "Bob",
    players: [
      { name: "Alice", won: false },
      { name: "Bob", won: true },
    ],
    turnCount: 8,
    startedAt: 0,
    finishedAt: 1,
  },
];

it("builds a case-insensitive leaderboard from completed games", () => {
  expect(buildGameHistoryData(games).leaderboard).toEqual([
    { name: "Bob", games: 1, wins: 1, losses: 0, winRate: 1 },
    { name: "alice", games: 2, wins: 1, losses: 1, winRate: 0.5 },
    { name: "Charlie", games: 1, wins: 0, losses: 1, winRate: 0 },
  ]);
});
