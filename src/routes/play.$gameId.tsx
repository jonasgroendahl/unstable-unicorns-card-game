import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GameBoard } from "#/components/game/GameBoard.tsx";
import { RemoteGameClient } from "#/lib/gameClient.ts";
import { useGameView } from "#/lib/useGameView.ts";
import { useSessionSeatId } from "#/lib/useSessionSeatId.ts";
import { audio } from "#/lib/audio.ts";
import { Button } from "#/components/ui/button.tsx";

export const Route = createFileRoute("/play/$gameId")({ component: PlayGame });

function PlayGame() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const youId = useSessionSeatId(gameId);

  const clientRef = useRef<RemoteGameClient | null>(null);
  if (!clientRef.current && youId) clientRef.current = new RemoteGameClient(gameId);
  const client = clientRef.current;

  useEffect(() => {
    audio.unlock();
    return () => client?.dispose();
  }, [client]);

  const view = useGameView(client, youId ?? "");

  if (youId === undefined || !view || !client) {
    return (
      <div className="uu-root uu-starfield flex min-h-dvh items-center justify-center">
        <p className="text-white/60">Connecting to game…</p>
      </div>
    );
  }

  if (youId === null) {
    return (
      <div className="uu-root uu-starfield flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="text-white/70">You're not seated in this game.</p>
        <Button onClick={() => navigate({ to: "/" })}>Back home</Button>
      </div>
    );
  }

  const actions = {
    playCard: (id: string) => client.playCard(youId, id),
    drawForTurn: () => client.drawForTurn(youId),
    endTurn: () => client.endTurn(youId),
    resolveDecision: (v: Parameters<typeof client.resolveDecision>[1]) =>
      client.resolveDecision(youId, v),
    playReaction: (id: string | null) => client.playReaction(youId, id),
  };

  return <GameBoard view={view} actions={actions} />;
}
