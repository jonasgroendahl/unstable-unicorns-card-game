import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Copy, Crown, Play, User, X } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { toast } from "sonner";
import { addBotToLobby, getLobby, removeSeat, setLobbyDeck, startGame } from "#/server/actions.ts";
import type { Lobby } from "#/server/registry.ts";
import { useSessionSeatId } from "#/lib/useSessionSeatId.ts";
import { DECKS } from "#/game/decks.ts";
import { DeckPicker } from "#/components/game/DeckPicker.tsx";

export const Route = createFileRoute("/lobby/$gameId")({ component: LobbyView });

function LobbyView() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
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
      <div className="uu-root uu-starfield flex min-h-dvh items-center justify-center">
        <p className="text-white/60">Loading lobby…</p>
      </div>
    );
  }

  const isHost = youId === lobby.hostId;
  const canStart = lobby.seats.length >= 2;

  return (
    <div className="uu-root uu-starfield flex min-h-dvh items-center justify-center p-6">
      <div className="uu-glass relative z-10 w-full max-w-lg rounded-2xl p-6">
        <h1 className="uu-display mb-1 text-2xl font-bold text-amber-200">Lobby</h1>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-white/60">Join code:</span>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1 font-mono text-lg tracking-widest text-amber-200"
            onClick={() => {
              void navigator.clipboard?.writeText(lobby.joinCode);
              toast.success("Join code copied");
            }}
          >
            {lobby.joinCode} <Copy className="size-3.5" />
          </button>
        </div>

        <div className="mb-5">
          <DeckPicker
            value={lobby.deckId}
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
          />
          {!isHost && (
            <p className="mt-2 text-xs text-white/50">The host chooses the deck for this game.</p>
          )}
        </div>

        <div className="space-y-2">
          {lobby.seats.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="grid size-7 place-items-center rounded-full bg-white/15">
                {s.isBot ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <span className="font-medium">{s.name}</span>
              {s.id === lobby.hostId && <Crown className="size-4 text-amber-300" />}
              {s.id === youId && <span className="text-xs text-amber-200/80">(you)</span>}
              {isHost && s.id !== lobby.hostId && (
                <button
                  className="ml-auto text-white/40 hover:text-rose-300"
                  onClick={() =>
                    removeSeat({ data: { gameId, seatId: s.id } }).then((l) => setLobby(l ?? null))
                  }
                  title="Remove"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-white/50">
          {lobby.seats.length}/8 players · {DECKS[lobby.deckId].shortName} · win at{" "}
          {lobby.seats.length >= 6 ? 6 : 7} unicorns
        </p>

        {isHost ? (
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              disabled={lobby.seats.length >= 8}
              onClick={() => addBotToLobby({ data: { gameId } }).then((l) => l && setLobby(l))}
            >
              <Bot className="size-4" /> Add bot
            </Button>
            <Button
              className="ml-auto bg-amber-400 text-black hover:bg-amber-300"
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
              <Play className="size-4" /> Start game
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-center text-sm text-white/60">
            Waiting for the host to start the game…
          </p>
        )}
      </div>
    </div>
  );
}
