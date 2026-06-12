import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Crown, History, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card.tsx";
import { getGameHistory } from "#/server/actions.ts";

export const Route = createFileRoute("/history")({
  loader: () => getGameHistory(),
  component: HistoryPage,
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function HistoryPage() {
  const { leaderboard, games } = Route.useLoaderData();

  return (
    <main className="uu-root uu-starfield min-h-dvh px-4 py-8 sm:px-6">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary">
              <Users /> Human games only
            </Badge>
            <h1 className="uu-display mt-3 text-4xl font-bold text-amber-200">Hall of Unicorns</h1>
            <p className="mt-1 text-sm text-white/60">
              Leaderboard standings and every completed game played without bots.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft data-icon="inline-start" /> Home
            </Link>
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-amber-300" /> Leaderboard
              </CardTitle>
              <CardDescription>Ranked by wins, then win rate and games played.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {leaderboard.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Complete an all-human game to claim the first spot.
                </p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={player.name} className="border-b last:border-b-0">
                    <div className="flex items-center gap-3 py-3">
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <Avatar>
                        <AvatarFallback>{player.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{player.name}</p>
                          {index === 0 ? <Crown className="text-amber-300" /> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {player.wins} wins · {player.losses} losses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums">
                          {Math.round(player.winRate * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{player.games} games</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History /> Past games
              </CardTitle>
              <CardDescription>Newest completed games appear first.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {games.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No completed all-human games yet.
                </p>
              ) : (
                games.map((game) => (
                  <div key={game.gameId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 font-semibold">
                          <Crown className="text-amber-300" /> {game.winnerName} won
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {game.players.map((player) => player.name).join(" · ")}
                        </p>
                      </div>
                      <Badge variant="outline">{game.turnCount} turns</Badge>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays /> {dateFormatter.format(game.finishedAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
