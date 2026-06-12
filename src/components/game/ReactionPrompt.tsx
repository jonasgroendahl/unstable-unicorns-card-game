import { useEffect, useState } from "react";
import { Ban, Eye, Hand, Sparkles } from "lucide-react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { CardView } from "./CardView.tsx";
import { audio } from "#/lib/audio.ts";
import { REACTION_WINDOW_MS } from "#/game/types.ts";
import type { ReactionView } from "#/game/view.ts";

interface ReactionPromptProps {
  reaction: ReactionView;
  playerName: (id: string) => string;
  onNeigh: (instanceId: string) => void;
  onPass: () => void;
}

export function ReactionPrompt({ reaction, playerName, onNeigh, onPass }: ReactionPromptProps) {
  const [remaining, setRemaining] = useState(reaction.closesAt - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(reaction.closesAt - Date.now());
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [reaction.closesAt]);

  useEffect(() => {
    if (reaction.canRespond && remaining > 0 && remaining < 3000 && remaining % 1000 < 100) {
      audio.play("tick");
    }
  }, [remaining, reaction.canRespond]);

  const pct = Math.max(0, Math.min(1, remaining / REACTION_WINDOW_MS));
  const seconds = Math.ceil(Math.max(0, remaining) / 1000);
  const latestNeigh = reaction.chain.at(-1);
  const wouldCancel = reaction.chain.length % 2 === 1;

  return (
    <section
      className="uu-reaction-layer pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3"
      aria-label="Neigh response window"
    >
      <div className="uu-glass uu-reaction-dock pointer-events-auto w-[min(94vw,760px)] overflow-y-auto rounded-2xl p-3 shadow-2xl">
        <div className="flex items-start gap-3">
          {reaction.targetCard ? (
            <CardView card={reaction.targetCard} size="sm" />
          ) : (
            <div className="uu-card uu-cardback w-16 aspect-[5/7]">
              <Sparkles className="size-4 text-amber-200/70" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Neigh window</Badge>
              <span className="truncate text-sm font-bold text-amber-100">
                {reaction.targetCard?.name ?? "A card"} by {playerName(reaction.targetByPlayer)}
              </span>
            </div>
            <p className="mt-1 hidden items-center gap-1.5 text-[11px] text-white/55 sm:flex">
              <Eye className="size-3" />
              The board stays active. Hover cards and inspect every stable before deciding.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/35">
              <div
                className="uu-reaction-progress h-full rounded-full"
                data-urgent={pct <= 0.25 ? "true" : undefined}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>

          <div className="flex min-w-12 flex-col items-center rounded-xl bg-black/25 px-2 py-1.5">
            <span className="text-xl font-black tabular-nums text-amber-100">{seconds}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">sec</span>
          </div>
        </div>

        {latestNeigh ? (
          <NeighReveal
            key={latestNeigh.card.instanceId}
            card={latestNeigh.card}
            player={playerName(latestNeigh.byPlayer)}
            wouldCancel={wouldCancel}
          />
        ) : (
          <div className="my-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="uu-display text-base font-bold text-amber-200">
              Will anyone play a Neigh?
            </p>
            <p className="text-[11px] text-white/50">
              An odd number of Neighs cancels the original card.
            </p>
          </div>
        )}

        {reaction.chain.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {reaction.chain.map((link) => (
              <Badge key={link.card.instanceId} variant="secondary">
                {playerName(link.byPlayer)}: {link.card.name}
              </Badge>
            ))}
            <Badge variant={wouldCancel ? "destructive" : "outline"}>
              {wouldCancel ? "Original card is cancelled" : "Original card resolves"}
            </Badge>
          </div>
        )}

        {reaction.canRespond ? (
          <div className="uu-reaction-response rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-amber-100">Your response</div>
                <div className="text-[10px] text-white/45">Play a Neigh card or pass.</div>
              </div>
              <Button variant="secondary" size="sm" onClick={onPass}>
                <Ban data-icon="inline-start" /> Pass
              </Button>
            </div>
            <div className="uu-reaction-neighs mt-2 flex flex-wrap items-center justify-center gap-2">
              {reaction.playableNeighs.map((c) => (
                <CardView
                  key={c.instanceId}
                  card={c}
                  size="sm"
                  playable
                  onClick={() => onNeigh(c.instanceId)}
                  title={`Play ${c.name}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60">
            <Hand className="size-4" /> Waiting for another player to respond. You can inspect the
            board meanwhile.
          </p>
        )}
      </div>
    </section>
  );
}

function NeighReveal({
  card,
  player,
  wouldCancel,
}: {
  card: ReactionView["chain"][number]["card"];
  player: string;
  wouldCancel: boolean;
}) {
  return (
    <div className="uu-neigh-scene my-3 flex items-center justify-center gap-4 rounded-xl border border-amber-200/20 bg-black/25 px-4 py-2.5">
      <div className="uu-neigh-flip-stage">
        <div className="uu-neigh-flip-card">
          <div className="uu-neigh-flip-face uu-neigh-flip-back">
            <Sparkles className="size-4 text-amber-200/80" />
          </div>
          <div className="uu-neigh-flip-face uu-neigh-flip-front">
            <img src={card.image} alt={card.name} draggable={false} />
          </div>
        </div>
      </div>
      <div className="uu-neigh-reveal-copy min-w-0" role="status" aria-live="assertive">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/70">
          Neigh played
        </div>
        <div className="uu-display truncate text-lg font-bold text-amber-100">{player}</div>
        <div className="text-xs text-white/65">
          revealed <strong className="text-white">{card.name}</strong>.{" "}
          {wouldCancel ? "The original card is now cancelled." : "The original card can resolve."}
        </div>
      </div>
    </div>
  );
}
