import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { GameBoard } from "#/components/game/GameBoard.tsx";
import { LocalGameClient } from "#/lib/gameClient.ts";
import { useGameView } from "#/lib/useGameView.ts";
import { audio } from "#/lib/audio.ts";
import type { SeatConfig } from "#/game/state.ts";
import { DeckPicker } from "#/components/game/DeckPicker.tsx";
import { DEFAULT_DECK_ID, type DeckId, type ExpansionId } from "#/game/decks.ts";

export const Route = createFileRoute("/debug")({ component: DebugGame });

interface Setup {
  humans: number;
  bots: number;
  deckId: DeckId;
  expansionIds: ExpansionId[];
}

function DebugGame() {
  const [setup, setSetup] = useState<Setup | null>(null);
  if (!setup) return <SetupScreen onStart={setSetup} />;
  return (
    <LocalGame
      humans={setup.humans}
      bots={setup.bots}
      deckId={setup.deckId}
      expansionIds={setup.expansionIds}
    />
  );
}

function SetupScreen({ onStart }: { onStart: (s: Setup) => void }) {
  const [humans, setHumans] = useState(1);
  const [bots, setBots] = useState(3);
  const [deckId, setDeckId] = useState<DeckId>(DEFAULT_DECK_ID);
  const [expansionIds, setExpansionIds] = useState<ExpansionId[]>([]);
  const total = humans + bots;
  return (
    <div className="uu-root uu-starfield flex min-h-dvh items-center justify-center p-6">
      <div className="uu-glass relative z-10 w-full max-w-md rounded-2xl p-6">
        <h1 className="uu-display mb-1 text-2xl font-bold text-amber-200">Quick Play</h1>
        <p className="mb-5 text-sm text-white/60">
          Run a full game locally — no lobby needed. Hotseat humans share this screen; bots play
          themselves. Great for testing every card.
        </p>

        <Stepper
          label="Human seats (hotseat)"
          value={humans}
          min={0}
          max={8}
          onChange={setHumans}
        />
        <Stepper label="AI bots" value={bots} min={0} max={8} onChange={setBots} />
        <DeckPicker
          value={deckId}
          onChange={setDeckId}
          expansionIds={expansionIds}
          onExpansionChange={setExpansionIds}
          playerCount={total}
        />

        <p className="mt-3 text-xs text-white/50">
          {total < 2
            ? "Need at least 2 players."
            : total > 8
              ? "Maximum 8 players."
              : `${total} players — win at ${total >= 6 ? 6 : 7} unicorns.`}
        </p>

        <Button
          className="mt-4 w-full bg-amber-400 text-black hover:bg-amber-300"
          disabled={total < 2 || total > 8}
          onClick={() => {
            audio.unlock();
            onStart({ humans, bots, deckId, expansionIds });
          }}
        >
          Start game
        </Button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <div className="flex items-center gap-2">
        <Button size="icon-sm" variant="outline" onClick={() => onChange(Math.max(min, value - 1))}>
          −
        </Button>
        <span className="w-6 text-center font-bold tabular-nums">{value}</span>
        <Button size="icon-sm" variant="outline" onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </Button>
      </div>
    </div>
  );
}

function LocalGame({
  humans,
  bots,
  deckId,
  expansionIds,
}: {
  humans: number;
  bots: number;
  deckId: DeckId;
  expansionIds: ExpansionId[];
}) {
  const seats = useMemo<SeatConfig[]>(() => {
    const s: SeatConfig[] = [];
    for (let i = 0; i < humans; i++) s.push({ id: `h${i}`, name: `Player ${i + 1}`, isBot: false });
    for (let i = 0; i < bots; i++) s.push({ id: `b${i}`, name: `Bot ${i + 1}`, isBot: true });
    return s;
  }, [humans, bots]);

  const clientRef = useRef<LocalGameClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new LocalGameClient(seats, undefined, deckId, expansionIds);
  }
  const client = clientRef.current;

  // The viewpoint: default to the first human, or seat 0.
  const humanSeats = seats.filter((s) => !s.isBot);
  const [viewerId, setViewerId] = useState(humanSeats[0]?.id ?? seats[0].id);

  useEffect(() => {
    return () => client.dispose();
  }, [client]);

  // Auto-follow the human who owes input, or the current player while spectating bots.
  const view = useGameView(client, viewerId);

  useEffect(() => {
    if (!view) return;

    // In hotseat, hand the screen to the next human who owes input. Reactions
    // take priority so every Neigh opens a visible counter-Neigh opportunity.
    if (humans > 1) {
      const humanIds = new Set(seats.filter((seat) => !seat.isBot).map((seat) => seat.id));
      const reactionResponder = client.engine.state.reaction?.awaitingFrom.find((id) =>
        humanIds.has(id),
      );
      const liveDecision = client.engine.state.pendingDecisions.at(-1);
      const decisionResponder =
        liveDecision && humanIds.has(liveDecision.playerId) ? liveDecision.playerId : undefined;
      const currentHuman = humanIds.has(view.currentPlayerId) ? view.currentPlayerId : undefined;
      const nextViewerId = reactionResponder ?? decisionResponder ?? currentHuman;

      if (nextViewerId && nextViewerId !== viewerId) {
        setViewerId(nextViewerId);
      }
      return;
    }

    // Pure bot game: follow the action.
    if (humans === 0 && view.currentPlayerId !== viewerId) {
      setViewerId(view.currentPlayerId);
    }
  }, [client, humans, seats, view, viewerId]);

  if (!view) return null;

  const actions = {
    playCard: (id: string) => client.playCard(viewerId, id),
    drawForTurn: () => client.drawForTurn(viewerId),
    endTurn: () => client.endTurn(viewerId),
    resolveDecision: (v: Parameters<typeof client.resolveDecision>[1]) =>
      void client.resolveDecision(view.decision?.playerId ?? viewerId, v),
    // Whoever currently can respond (the viewer) plays the reaction.
    playReaction: (id: string | null) => void client.playReaction(viewerId, id),
  };

  const seatSwitcher = (
    <div className="flex min-w-0 items-center gap-1">
      <Eye className="hidden size-3.5 text-white/50 sm:block" />
      <select
        value={viewerId}
        onChange={(e) => setViewerId(e.target.value)}
        className="max-w-28 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white sm:max-w-none"
        title="Switch viewpoint (debug)"
      >
        {seats.map((s) => (
          <option key={s.id} value={s.id}>
            {s.isBot ? "🤖 " : "👤 "}
            {s.name}
            {s.id === view.currentPlayerId ? " — turn" : ""}
          </option>
        ))}
      </select>
    </div>
  );

  return <GameBoard view={view} actions={actions} seatSwitcher={seatSwitcher} />;
}
