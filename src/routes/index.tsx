import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bolt,
  Coffee,
  Crown,
  Gamepad2,
  Github,
  ExternalLink,
  History,
  LogIn,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { GameThemeSelect } from "#/components/theme/GameThemeSelect.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";
import { env } from "#/env.ts";
import { audio } from "#/lib/audio.ts";
import {
  createLobby,
  getMatchmakingStatus,
  joinLobby,
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
} from "#/server/actions.ts";
import { toast } from "sonner";
import { DEFAULT_DECK_ID } from "#/game/decks.ts";
import { loadOrCreatePlayerName, savePlayerName } from "#/lib/playerName.ts";
import { cn } from "#/lib/utils.ts";
import type { MatchmakingStatus } from "#/server/registry.ts";

export const Route = createFileRoute("/")({ component: Home });

const MATCHMAKING_TICKET_KEY = "uu.matchmaking.ticket";
const PAYPAL_DONATE_URL = env.VITE_PAYPAL_DONATE_URL;
const FEATURE_CARD_CLASSES = [
  "uu-home-card-one",
  "uu-home-card-two",
  "uu-home-card-three",
  "uu-home-card-four",
] as const;

function Home() {
  const navigate = useNavigate();
  const { theme } = useGameTheme();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [queueTicketId, setQueueTicketId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<MatchmakingStatus | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);

  const playerName = () => name.trim() || "Player";

  useEffect(() => {
    setName(loadOrCreatePlayerName());
    setQueueTicketId(sessionStorage.getItem(MATCHMAKING_TICKET_KEY));
  }, []);

  useEffect(() => {
    savePlayerName(name);
  }, [name]);

  useEffect(() => {
    if (!queueTicketId) return;

    let alive = true;
    const poll = async () => {
      try {
        const status = await getMatchmakingStatus({ data: { ticketId: queueTicketId } });
        if (!alive) return;

        setQueueStatus(status);
        setQueueError(null);
        if (status.status === "not_found") {
          sessionStorage.removeItem(MATCHMAKING_TICKET_KEY);
          setQueueTicketId(null);
          return;
        }
        if (status.status === "matched" && status.gameId && status.youId) {
          sessionStorage.setItem(`uu.you.${status.gameId}`, status.youId);
          sessionStorage.removeItem(MATCHMAKING_TICKET_KEY);
          setQueueTicketId(null);
          await navigate({ to: "/play/$gameId", params: { gameId: status.gameId } });
        }
      } catch {
        if (alive) setQueueError("Unable to check the queue right now.");
      }
    };

    void poll();
    const id = setInterval(() => void poll(), 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [navigate, queueTicketId]);

  const host = async () => {
    audio.unlock();
    const hostName = name.trim();
    if (!hostName) {
      toast.error("Enter your name to host a game.");
      return;
    }
    setBusy(true);
    try {
      const res = await createLobby({ data: { hostName, deckId: DEFAULT_DECK_ID } });
      sessionStorage.setItem(`uu.you.${res.gameId}`, res.youId);
      await navigate({ to: "/lobby/$gameId", params: { gameId: res.gameId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    audio.unlock();
    if (code.trim().length < 3) {
      toast.error("Enter a join code.");
      return;
    }
    setBusy(true);
    try {
      const res = await joinLobby({ data: { joinCode: code.trim(), name: playerName() } });
      sessionStorage.setItem(`uu.you.${res.gameId}`, res.youId);
      await navigate({ to: "/lobby/$gameId", params: { gameId: res.gameId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const joinQueue = async () => {
    audio.unlock();
    const queueName = name.trim();
    if (!queueName) {
      toast.error("Enter your name to join the solo queue.");
      return;
    }

    setBusy(true);
    try {
      const status = await joinMatchmakingQueue({ data: { name: queueName } });
      sessionStorage.setItem(MATCHMAKING_TICKET_KEY, status.ticketId);
      setQueueStatus(status);
      setQueueError(null);
      setQueueTicketId(status.ticketId);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const leaveQueue = async () => {
    if (!queueTicketId) return;

    setBusy(true);
    try {
      await leaveMatchmakingQueue({ data: { ticketId: queueTicketId } });
      sessionStorage.removeItem(MATCHMAKING_TICKET_KEY);
      setQueueTicketId(null);
      setQueueStatus(null);
      setQueueError(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const waitingMessage =
    queueStatus?.otherPlayersWaiting === 0
      ? "No one else is in the queue right now."
      : `${queueStatus?.otherPlayersWaiting} other player${
          queueStatus?.otherPlayersWaiting === 1 ? "" : "s"
        } waiting. ${queueStatus?.playersWaiting}/${queueStatus?.matchSize} ready.`;

  return (
    <main className="uu-home">
      <div className="uu-home-speed-lines" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-one" aria-hidden="true" />
      <div className="uu-home-orb uu-home-orb-two" aria-hidden="true" />

      <div className="uu-home-shell">
        <header className="uu-home-topbar">
          <div className="uu-home-mini-brand">
            <span className="uu-home-mini-logo">
              <img src={theme.mark} alt="" />
            </span>
            <span>
              <strong>{theme.name}</strong>
              <small>Online party game</small>
            </span>
          </div>

          <div className="uu-home-top-actions">
            <Badge className="uu-home-online-badge">
              <span aria-hidden="true" />
              Servers online
            </Badge>
            <Button className="uu-home-history-button" variant="ghost" asChild>
              <Link to="/history">
                <History data-icon="inline-start" /> Hall of Fame
              </Link>
            </Button>
          </div>
        </header>

        <section className="uu-home-stage">
          <div className="uu-home-copy">
            <Badge className="uu-home-season-badge">
              <Crown /> {theme.badge}
            </Badge>
            <div className="uu-home-title-wrap">
              <p className="uu-home-eyebrow">{theme.eyebrow}</p>
              <h1 className="uu-home-title">
                <span>{theme.title[0]}</span>
                <strong>{theme.title[1]}</strong>
              </h1>
              <span className="uu-home-title-burst" aria-hidden="true">
                <Bolt />
              </span>
            </div>
            <p className="uu-home-tagline">{theme.tagline}</p>

            <div className="uu-home-stats" aria-label="Game information">
              <span>
                <Users aria-hidden="true" />
                <strong>2–8</strong> players
              </span>
              <span>
                <ShieldCheck aria-hidden="true" />
                <strong>84</strong> unique cards
              </span>
              <span>
                <Gamepad2 aria-hidden="true" />
                Live multiplayer
              </span>
            </div>

            <div className="uu-home-card-stage" aria-label={theme.featuredArtLabel}>
              {theme.featuredArt.map((art, index) => (
                <div key={art.src} className={cn("uu-home-card", FEATURE_CARD_CLASSES[index])}>
                  <img src={art.src} alt={art.alt} />
                </div>
              ))}
              <span className="uu-home-sticker uu-home-sticker-friends">{theme.firstSticker}</span>
              <span className="uu-home-sticker uu-home-sticker-chaos">{theme.secondSticker}</span>
            </div>
          </div>

          <aside className="uu-home-menu" aria-label="Game menu">
            <div className="uu-home-menu-head">
              <div>
                <p>Ready player?</p>
                <h2>Choose a game mode</h2>
              </div>
              <span className="uu-home-controller" aria-hidden="true">
                <Gamepad2 />
              </span>
            </div>

            <label className="uu-home-field">
              <span>Player name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                maxLength={20}
              />
            </label>

            {queueTicketId ? (
              <div className="uu-home-queue" role="status" aria-live="polite">
                <span className="uu-home-queue-spinner" aria-hidden="true" />
                <div>
                  <strong>Finding your rivals…</strong>
                  <p>
                    {queueError ??
                      (queueStatus?.status === "matched"
                        ? "Match found. Starting game…"
                        : queueStatus
                          ? waitingMessage
                          : "Checking the queue…")}
                  </p>
                </div>
                <Button variant="outline" onClick={leaveQueue} disabled={busy}>
                  Leave
                </Button>
              </div>
            ) : (
              <Button
                className="uu-home-mode uu-home-mode-primary"
                onClick={joinQueue}
                disabled={busy}
              >
                <span className="uu-home-mode-icon">
                  <Swords />
                </span>
                <span>
                  <strong>Find a match</strong>
                  <small>Jump into a 4-player battle</small>
                </span>
                <ArrowRight className="uu-home-mode-arrow" />
              </Button>
            )}

            <div className="uu-home-mode-grid">
              <Button
                className="uu-home-mode uu-home-mode-host"
                onClick={host}
                disabled={busy || Boolean(queueTicketId)}
              >
                <span className="uu-home-mode-icon">
                  <Plus />
                </span>
                <span>
                  <strong>Create room</strong>
                  <small>Invite friends & bots</small>
                </span>
              </Button>
              <Button
                className="uu-home-mode uu-home-mode-quick"
                disabled={busy}
                onClick={() => {
                  audio.unlock();
                  void navigate({ to: "/debug" });
                }}
              >
                <span className="uu-home-mode-icon">
                  <Bolt />
                </span>
                <span>
                  <strong>Quick battle</strong>
                  <small>Play instantly</small>
                </span>
              </Button>
            </div>

            <div className="uu-home-join">
              <label className="uu-home-field">
                <span>Got an invite code?</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  maxLength={8}
                />
              </label>
              <Button onClick={join} disabled={busy || Boolean(queueTicketId)}>
                <LogIn data-icon="inline-start" /> Join
              </Button>
            </div>

            <p className="uu-home-menu-note">
              <Sparkles aria-hidden="true" />
              Choose your deck and add bots after creating a room.
            </p>

            {PAYPAL_DONATE_URL ? (
              <div className="uu-home-support-row">
                <p>
                  <strong>Enjoying the chaos?</strong>
                  <span>Optional tiny tips help keep the table open.</span>
                </p>
                <Button className="uu-home-support-button" variant="outline" size="sm" asChild>
                  <a href={PAYPAL_DONATE_URL} target="_blank" rel="noreferrer">
                    <Coffee data-icon="inline-start" /> Tip
                  </a>
                </Button>
              </div>
            ) : null}
          </aside>
        </section>

        <footer className="uu-home-footer">
          <p>
            <strong>{theme.footerLead}</strong>
            <span>{theme.footerAside}</span>
          </p>
          <GameThemeSelect />
          <nav aria-label="Developer and business links">
            <a href="https://github.com/jonasgroendahl" target="_blank" rel="noreferrer">
              <Github aria-hidden="true" /> GitHub
            </a>
            <a href="mailto:jonas.groendahlxd@gmail.com">
              <Mail aria-hidden="true" /> Business
            </a>
            {PAYPAL_DONATE_URL ? (
              <a href={PAYPAL_DONATE_URL} target="_blank" rel="noreferrer">
                <Coffee aria-hidden="true" /> Support
              </a>
            ) : null}
            <a href="https://byggegrundesiden.dk" target="_blank" rel="noreferrer">
              More projects <ExternalLink aria-hidden="true" />
            </a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
