// Standalone responsive-UI sandbox: renders <GameBoard> against a synthetic
// GameView so layouts can be stress-tested without running an actual game.
// 4 players, packed stables, adjustable card counts — no engine, no network.

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { GameBoard, type BoardActions } from "#/components/game/GameBoard.tsx";
import { getDefinition } from "#/game/cards";
import type { CardView, GameView, PlayerView } from "#/game/view.ts";

export const Route = createFileRoute("/debug-ui")({ component: DebugUi });

// Real slugs (from cardData) so names/art/text render exactly as in a live game.
const UNICORNS = [
  "basic-unicorn-blue",
  "basic-unicorn-green",
  "basic-unicorn-indigo",
  "basic-unicorn-orange",
  "basic-unicorn-purple",
  "basic-unicorn-red",
  "basic-unicorn-yellow",
  "alluring-narwhal",
  "americorn",
  "angel-unicorn",
  "black-knight-unicorn",
  "chainsaw-unicorn",
  "ginormous-unicorn",
  "llamacorn",
  "magical-kittencorn",
  "mermaid-unicorn",
  "narwhal",
  "puppicorn",
  "queen-bee-unicorn",
];
const UPGRADES = ["extra-tail", "rainbow-aura", "rainbow-mane", "double-dutch", "glitter-bomb"];
const DOWNGRADES = ["barbed-wire", "blinding-light", "slowdown", "tiny-stable", "nanny-cam"];
const MAGIC = [
  "back-kick",
  "blatant-thievery",
  "good-deal",
  "targeted-destruction",
  "two-for-one",
  "unicorn-swap",
];
const INSTANTS = ["neigh", "super-neigh"];

// A realistic hand: mix of unicorns, magic spells, an upgrade, a downgrade, and
// Neighs — cycled so a larger hand keeps a believable spread of card types.
const HAND_POOL = [
  UNICORNS[7], // alluring-narwhal
  MAGIC[0], // back-kick
  UNICORNS[0], // basic-unicorn-blue
  INSTANTS[0], // neigh
  MAGIC[3], // targeted-destruction
  UPGRADES[0], // extra-tail
  UNICORNS[12], // ginormous-unicorn
  MAGIC[1], // blatant-thievery
  DOWNGRADES[0], // barbed-wire
  UNICORNS[9], // black-knight-unicorn
  INSTANTS[1], // super-neigh
  MAGIC[2], // good-deal
  UNICORNS[16], // narwhal
  MAGIC[4], // two-for-one
  UNICORNS[3], // basic-unicorn-orange
  MAGIC[5], // unicorn-swap
  UPGRADES[2], // rainbow-mane
  INSTANTS[0], // neigh
  UNICORNS[14], // magical-kittencorn
  DOWNGRADES[2], // slowdown
];

const SEAT_NAMES = ["Alice", "Bob", "Carmen", "Dmitri", "Elena", "Felix", "Grace", "Hugo"];

// Seat 0 is the lone human; every seat after it is a bot, capped at the name pool.
function buildSeats(bots: number) {
  return SEAT_NAMES.slice(0, bots + 1).map((name, i) => ({
    id: `p${i}`,
    name,
    isBot: i > 0,
  }));
}

let counter = 0;
function card(slug: string, ownerId: string): CardView {
  const def = getDefinition(slug);
  return {
    instanceId: `dbg-${counter++}`,
    slug: def.id,
    name: def.name,
    kind: def.kind,
    cardClass: def.cardClass,
    text: def.text,
    image: def.image,
    ownerId,
    borrowed: false,
  };
}

/** Build a stable with `unicorns` unicorns + `upgrades`/`downgrades` modifiers. */
function buildStable(
  ownerId: string,
  unicorns: number,
  upgrades: number,
  downgrades: number,
): CardView[] {
  const out: CardView[] = [];
  for (let i = 0; i < unicorns; i++) out.push(card(UNICORNS[i % UNICORNS.length], ownerId));
  for (let i = 0; i < upgrades; i++) out.push(card(UPGRADES[i % UPGRADES.length], ownerId));
  for (let i = 0; i < downgrades; i++) out.push(card(DOWNGRADES[i % DOWNGRADES.length], ownerId));
  return out;
}

const NOOP_ACTIONS: BoardActions = {
  playCard: async () => "Debug board — actions are disabled.",
  drawForTurn: async () => "Debug board — actions are disabled.",
  endTurn: async () => "Debug board — actions are disabled.",
  resolveDecision: () => {},
  playReaction: () => {},
};

function DebugUi() {
  const [viewerId, setViewerId] = useState<string>("p0");
  const [bots, setBots] = useState(3);
  const [unicorns, setUnicorns] = useState(14);
  const [upgrades, setUpgrades] = useState(3);
  const [downgrades, setDowngrades] = useState(2);
  const [handSize, setHandSize] = useState(6);

  const seats = useMemo(() => buildSeats(bots), [bots]);
  // Decrementing bots can drop the seat we're viewing — fall back to seat 0.
  const activeViewerId = seats.some((s) => s.id === viewerId) ? viewerId : seats[0].id;

  const view = useMemo<GameView>(() => {
    counter = 0; // stable instanceIds per render config
    const players: PlayerView[] = seats.map((seat) => {
      const stable = buildStable(seat.id, unicorns, upgrades, downgrades);
      const isViewer = seat.id === activeViewerId;
      const hand = isViewer
        ? Array.from({ length: handSize }, (_, i) => card(HAND_POOL[i % HAND_POOL.length], seat.id))
        : null;
      return {
        id: seat.id,
        name: seat.name,
        isBot: seat.isBot,
        connected: true,
        isCurrent: seat.id === activeViewerId,
        unicornCount: stable.filter((c) => c.cardClass === "unicorn").length,
        stable,
        handCount: handSize,
        hand,
      };
    });

    return {
      gameId: "debug-ui",
      deckId: "base-first-edition",
      expansionIds: [],
      status: "active",
      phase: "action",
      viewerId: activeViewerId,
      currentPlayerId: activeViewerId,
      turnNumber: 7,
      winThreshold: 7,
      deckCount: 32,
      discardTop: card("americorn", seats[0].id),
      discardCount: 9,
      nurseryCount: 4,
      players,
      actionsRemaining: { plays: 1, draws: 1 },
      playedThisTurn: false,
      autoDrawnCardId: null,
      decision: null,
      someoneDeciding: null,
      reaction: null,
      log: [],
    };
  }, [seats, activeViewerId, unicorns, upgrades, downgrades, handSize]);

  const seatSwitcher = (
    <div className="flex min-w-0 items-center gap-2">
      <Eye className="hidden size-3.5 text-white/50 sm:block" />
      <select
        value={activeViewerId}
        onChange={(e) => setViewerId(e.target.value)}
        className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
        title="Switch viewpoint (debug)"
      >
        {seats.map((s) => (
          <option key={s.id} value={s.id}>
            {s.isBot ? "🤖 " : "👤 "}
            {s.name}
          </option>
        ))}
      </select>
      <DebugStepper label="🤖" value={bots} min={1} max={7} onChange={setBots} />
      <DebugStepper label="🦄" value={unicorns} min={0} max={40} onChange={setUnicorns} />
      <DebugStepper label="↑" value={upgrades} min={0} max={12} onChange={setUpgrades} />
      <DebugStepper label="⚠" value={downgrades} min={0} max={12} onChange={setDowngrades} />
      <DebugStepper label="🖐" value={handSize} min={0} max={20} onChange={setHandSize} />
    </div>
  );

  return <GameBoard view={view} actions={NOOP_ACTIONS} seatSwitcher={seatSwitcher} />;
}

function DebugStepper({
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
    <div className="flex items-center gap-1 rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 text-xs text-white">
      <span className="select-none">{label}</span>
      <button
        type="button"
        className="px-1 text-white/70 hover:text-white"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="w-5 text-center tabular-nums">{value}</span>
      <button
        type="button"
        className="px-1 text-white/70 hover:text-white"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
