import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Copy,
  Crown,
  Gamepad2,
  Play,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { toast } from "sonner";
import {
  addBotToLobby,
  getLobby,
  removeSeat,
  setBotDifficulty,
  setLobbyDeck,
  setLobbyExpansions,
  startGame,
} from "#/server/actions.ts";
import type { Lobby } from "#/server/registry.ts";
import { useSessionSeatId } from "#/lib/useSessionSeatId.ts";
import { DECKS, EXPANSIONS } from "#/game/decks.ts";
import { DEFAULT_BOT_DIFFICULTY } from "#/game/types.ts";
import { DeckPicker } from "#/components/game/DeckPicker.tsx";
import {
  AddBotControl,
  BOT_DIFFICULTY_LABELS,
  BotDifficultyBadge,
  BotDifficultyToggle,
} from "#/components/game/BotDifficultyControl.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";

export const Route = createFileRoute("/lobby/$gameId")({ component: LobbyView });

function LobbyView() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const { theme } = useGameTheme();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const youId = useSessionSeatId(gameId);

  // Poll the lobby until the game starts, then go to the board.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const l = await getLobby({ data: { gameId } });
        if (!alive) return;
        setLobby(l);
        if (l.status === "active") {
          await navigate({ to: "/play/$gameId", params: { gameId } });
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = setInterval(() => void poll(), 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [gameId, navigate]);

  if (!lobby || youId === undefined) {
    return (
      <main className="uu-lobby uu-lobby-loading">
        <div className="uu-lobby-loading-card">
          <span aria-hidden="true" />
          <strong>Opening battle room…</strong>
        </div>
      </main>
    );
  }

  const isHost = youId === lobby.hostId;
  const canStart = lobby.seats.length >= 2;
  const openSeats = Math.max(0, 8 - lobby.seats.length);
  const winAt = lobby.seats.length >= 6 ? 6 : 7;

  return (
    <main className="uu-lobby">
      <div className="uu-home-speed-lines" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-one" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-two" aria-hidden="true" />

      <div className="uu-lobby-shell">
        <header className="uu-lobby-topbar">
          <Link className="uu-lobby-back" to="/">
            <ArrowLeft aria-hidden="true" />
            Main menu
          </Link>

          <div className="uu-lobby-mini-brand">
            <span>
              <img src={theme.mark} alt="" />
            </span>
            <strong>{theme.name}</strong>
          </div>

          <Badge className="uu-lobby-status">
            <span aria-hidden="true" />
            Room online
          </Badge>
        </header>

        <section className="uu-lobby-hero">
          <div>
            <Badge className="uu-lobby-kicker">
              <Gamepad2 /> Multiplayer battle room
            </Badge>
            <h1>{theme.lobbyHeading}</h1>
            <p>{theme.lobbyDescription}</p>
          </div>

          <div className="uu-lobby-code-wrap">
            <span>Invite code</span>
            <button
              className="uu-lobby-code"
              onClick={() => {
                void navigator.clipboard?.writeText(lobby.joinCode);
                toast.success("Join code copied");
              }}
            >
              <strong>{lobby.joinCode}</strong>
              <Copy aria-hidden="true" />
            </button>
            <small>Click to copy and send to your rivals</small>
          </div>
        </section>

        <section className="uu-lobby-grid">
          <div className="uu-lobby-panel uu-lobby-roster">
            <div className="uu-lobby-panel-head">
              <div>
                <span>Battle roster</span>
                <h2>Players in the room</h2>
              </div>
              <Badge className="uu-lobby-count">
                <Users /> {lobby.seats.length}/8
              </Badge>
            </div>

            <div className="uu-lobby-seats">
              {lobby.seats.map((seat, index) => (
                <div
                  key={seat.id}
                  className="uu-lobby-seat"
                  data-host={seat.id === lobby.hostId}
                  data-you={seat.id === youId}
                  data-connected={seat.connected}
                >
                  <span className="uu-lobby-seat-number">{index + 1}</span>
                  <span className="uu-lobby-avatar">
                    {seat.isBot ? <Bot aria-hidden="true" /> : <User aria-hidden="true" />}
                  </span>
                  <span className="uu-lobby-seat-name">
                    <strong>{seat.name}</strong>
                    <small>
                      {seat.id === youId
                        ? "You"
                        : seat.isBot
                          ? `${BOT_DIFFICULTY_LABELS[seat.botDifficulty ?? DEFAULT_BOT_DIFFICULTY]} bot`
                          : seat.connected
                            ? "Ready to play"
                            : "Reconnecting…"}
                    </small>
                  </span>
                  {seat.id === lobby.hostId && (
                    <Badge className="uu-lobby-host-badge">
                      <Crown /> Host
                    </Badge>
                  )}
                  {seat.isBot &&
                    (isHost ? (
                      <BotDifficultyToggle
                        compact
                        value={seat.botDifficulty ?? DEFAULT_BOT_DIFFICULTY}
                        ariaLabel={`Difficulty for ${seat.name}`}
                        onChange={async (difficulty) => {
                          try {
                            setLobby(
                              await setBotDifficulty({
                                data: {
                                  gameId,
                                  playerId: youId,
                                  botId: seat.id,
                                  difficulty,
                                },
                              }),
                            );
                          } catch (error) {
                            toast.error((error as Error).message);
                          }
                        }}
                      />
                    ) : (
                      <BotDifficultyBadge difficulty={seat.botDifficulty} />
                    ))}
                  {isHost && seat.id !== lobby.hostId && (
                    <button
                      className="uu-lobby-remove"
                      onClick={() =>
                        removeSeat({ data: { gameId, seatId: seat.id } }).then((nextLobby) =>
                          setLobby(nextLobby ?? null),
                        )
                      }
                      title={`Remove ${seat.name}`}
                      aria-label={`Remove ${seat.name}`}
                    >
                      <X aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}

              {Array.from({ length: openSeats }, (_, index) => (
                <div key={`open-seat-${index}`} className="uu-lobby-seat uu-lobby-seat-open">
                  <span className="uu-lobby-seat-number">{lobby.seats.length + index + 1}</span>
                  <span className="uu-lobby-avatar">
                    <Sparkles aria-hidden="true" />
                  </span>
                  <span className="uu-lobby-seat-name">
                    <strong>Open seat</strong>
                    <small>Waiting for a player</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="uu-lobby-roster-footer">
              <p>
                <ShieldCheck aria-hidden="true" />
                {canStart
                  ? "Enough players to start the battle."
                  : "Invite one more player or add a bot to begin."}
              </p>
              {isHost && (
                <AddBotControl
                  disabled={lobby.seats.length >= 8}
                  onAdd={async (difficulty) => {
                    try {
                      const next = await addBotToLobby({
                        data: { gameId, playerId: youId, difficulty },
                      });
                      if (next) setLobby(next);
                    } catch (error) {
                      toast.error((error as Error).message);
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="uu-lobby-panel uu-lobby-setup">
            <div className="uu-lobby-panel-head">
              <div>
                <span>Match setup</span>
                <h2>Choose your chaos</h2>
              </div>
              <span className="uu-lobby-setup-icon" aria-hidden="true">
                <Zap />
              </span>
            </div>

            <DeckPicker
              value={lobby.deckId}
              expansionIds={lobby.expansionIds}
              playerCount={lobby.seats.length}
              onChange={
                isHost
                  ? async (deckId) => {
                      try {
                        setLobby(await setLobbyDeck({ data: { gameId, playerId: youId, deckId } }));
                      } catch (error) {
                        toast.error((error as Error).message);
                      }
                    }
                  : undefined
              }
              onExpansionChange={
                isHost
                  ? async (expansionIds) => {
                      try {
                        setLobby(
                          await setLobbyExpansions({
                            data: { gameId, playerId: youId, expansionIds },
                          }),
                        );
                      } catch (error) {
                        toast.error((error as Error).message);
                      }
                    }
                  : undefined
              }
            />

            {!isHost && (
              <p className="uu-lobby-guest-note">The host chooses the deck for this game.</p>
            )}

            <div className="uu-lobby-rules">
              <div>
                <span>Players</span>
                <strong>{lobby.seats.length}/8</strong>
              </div>
              <div>
                <span>Base deck</span>
                <strong>{DECKS[lobby.deckId].shortName}</strong>
              </div>
              <div>
                <span>Expansion</span>
                <strong>
                  {lobby.expansionIds.length === 0
                    ? "None"
                    : lobby.expansionIds.map((id) => EXPANSIONS[id].shortName).join(", ")}
                </strong>
              </div>
              <div>
                <span>Victory</span>
                <strong>{winAt} unicorns</strong>
              </div>
            </div>

            {isHost ? (
              <Button
                className="uu-lobby-start"
                disabled={!canStart}
                onClick={async () => {
                  try {
                    await startGame({ data: { gameId } });
                    await navigate({ to: "/play/$gameId", params: { gameId } });
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Play data-icon="inline-start" />
                <span>
                  <strong>{canStart ? "Start battle" : "Waiting for players"}</strong>
                  <small>
                    {canStart
                      ? `${lobby.seats.length} players ready for chaos`
                      : "You need at least 2 players"}
                  </small>
                </span>
              </Button>
            ) : (
              <div className="uu-lobby-waiting" role="status">
                <span aria-hidden="true" />
                <div>
                  <strong>Waiting for the host</strong>
                  <small>The battle will begin when everyone is ready.</small>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
