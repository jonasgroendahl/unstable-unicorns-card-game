import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  Gamepad2,
  History,
  Medal,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { getGameHistory } from "#/server/actions.ts";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";

export const Route = createFileRoute("/history")({
  loader: () => getGameHistory(),
  component: HistoryPage,
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function HistoryPage() {
  const { theme } = useGameTheme();
  const { leaderboard, games } = Route.useLoaderData();
  const champion = leaderboard[0];
  const podium = leaderboard.slice(0, 3);
  const remainingPlayers = leaderboard.slice(3);

  return (
    <main className="uu-history">
      <div className="uu-home-speed-lines" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-one" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-two" aria-hidden="true" />

      <div className="uu-history-shell">
        <header className="uu-history-topbar">
          <Link className="uu-history-back" to="/">
            <ArrowLeft aria-hidden="true" />
            Main menu
          </Link>

          <div className="uu-history-mini-brand">
            <span>
              <img src={theme.mark} alt="" />
            </span>
            <strong>{theme.name}</strong>
          </div>

          <Badge className="uu-history-human-badge">
            <Users /> Human games only
          </Badge>
        </header>

        <section className="uu-history-hero">
          <div>
            <Badge className="uu-history-kicker">
              <Trophy /> Hall of Fame
            </Badge>
            <h1>{theme.historyHeading}</h1>
            <p>{theme.historyDescription}</p>
          </div>

          <div className="uu-history-stats" aria-label="Hall of Fame statistics">
            <div>
              <span>
                <Gamepad2 aria-hidden="true" />
              </span>
              <small>Completed battles</small>
              <strong>{games.length}</strong>
            </div>
            <div>
              <span>
                <Users aria-hidden="true" />
              </span>
              <small>Ranked players</small>
              <strong>{leaderboard.length}</strong>
            </div>
            <div>
              <span>
                <Crown aria-hidden="true" />
              </span>
              <small>Top champion</small>
              <strong>{champion?.name ?? "Unclaimed"}</strong>
            </div>
          </div>
        </section>

        <section className="uu-history-grid">
          <div className="uu-history-panel uu-history-leaderboard">
            <div className="uu-history-panel-head">
              <div>
                <span>Global rankings</span>
                <h2>{theme.championsHeading}</h2>
              </div>
              <span className="uu-history-panel-icon" aria-hidden="true">
                <Medal />
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="uu-history-empty">
                <span>
                  <Trophy aria-hidden="true" />
                </span>
                <strong>The throne is empty</strong>
                <p>Complete an all-human game to claim the first spot.</p>
                <Link to="/">Start a battle</Link>
              </div>
            ) : (
              <>
                <div className="uu-history-podium">
                  {podium.map((player, index) => (
                    <article
                      key={player.name}
                      className="uu-history-podium-player"
                      data-rank={index + 1}
                    >
                      <span className="uu-history-rank">{index + 1}</span>
                      <Avatar className="uu-history-avatar">
                        <AvatarFallback>{player.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <span className="uu-history-crown" aria-hidden="true">
                          <Crown />
                        </span>
                      )}
                      <strong>{player.name}</strong>
                      <small>
                        {player.wins} {player.wins === 1 ? "win" : "wins"} ·{" "}
                        {Math.round(player.winRate * 100)}%
                      </small>
                      <div>
                        <span>{player.games} games</span>
                        <span>{player.losses} losses</span>
                      </div>
                    </article>
                  ))}
                </div>

                {remainingPlayers.length > 0 && (
                  <div className="uu-history-standings">
                    {remainingPlayers.map((player, index) => (
                      <div key={player.name} className="uu-history-standing">
                        <span className="uu-history-standing-rank">{index + 4}</span>
                        <Avatar className="uu-history-standing-avatar">
                          <AvatarFallback>{player.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="uu-history-standing-name">
                          <strong>{player.name}</strong>
                          <small>
                            {player.wins} wins · {player.losses} losses
                          </small>
                        </span>
                        <span className="uu-history-standing-score">
                          <strong>{Math.round(player.winRate * 100)}%</strong>
                          <small>{player.games} games</small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="uu-history-panel uu-history-matches">
            <div className="uu-history-panel-head">
              <div>
                <span>Battle archive</span>
                <h2>Recent match results</h2>
              </div>
              <span className="uu-history-panel-icon uu-history-panel-icon-cyan" aria-hidden="true">
                <History />
              </span>
            </div>

            {games.length === 0 ? (
              <div className="uu-history-empty">
                <span>
                  <Swords aria-hidden="true" />
                </span>
                <strong>No battles recorded yet</strong>
                <p>Games without bots will appear here after the final unicorn wins.</p>
                <Link to="/">Gather your rivals</Link>
              </div>
            ) : (
              <div className="uu-history-match-list">
                {games.map((game, index) => (
                  <article key={game.gameId} className="uu-history-match">
                    <span className="uu-history-match-number">Match #{games.length - index}</span>
                    <div className="uu-history-match-winner">
                      <span>
                        <Crown aria-hidden="true" />
                      </span>
                      <div>
                        <small>Battle champion</small>
                        <strong>{game.winnerName}</strong>
                      </div>
                    </div>
                    <div className="uu-history-match-players">
                      {game.players.map((player) => (
                        <span key={player.name} data-winner={player.won}>
                          {player.name}
                        </span>
                      ))}
                    </div>
                    <div className="uu-history-match-meta">
                      <span>
                        <Zap aria-hidden="true" />
                        {game.turnCount} turns
                      </span>
                      <span>
                        <CalendarDays aria-hidden="true" />
                        {dateFormatter.format(game.finishedAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
