import { useEffect, useState } from "react";
import { Ban, Hand } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { CardView } from "./CardView.tsx";
import { audio } from "#/lib/audio.ts";
import type { ReactionView } from "#/game/view.ts";

interface ReactionPromptProps {
  reaction: ReactionView;
  playerName: (id: string) => string;
  onNeigh: (instanceId: string) => void;
  onPass: () => void;
}

export function ReactionPrompt({ reaction, playerName, onNeigh, onPass }: ReactionPromptProps) {
  const total = 5000;
  const [remaining, setRemaining] = useState(reaction.closesAt - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(reaction.closesAt - Date.now());
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [reaction.closesAt]);

  // Tick sound in the final 3 seconds.
  useEffect(() => {
    if (reaction.canRespond && remaining > 0 && remaining < 3000 && remaining % 1000 < 100) {
      audio.play("tick");
    }
  }, [remaining, reaction.canRespond]);

  const pct = Math.max(0, Math.min(1, remaining / total));
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="uu-glass uu-pop w-[min(92vw,440px)] rounded-2xl p-5 text-center shadow-2xl">
        <div className="mb-3 flex items-center justify-center gap-3">
          {/* Countdown ring */}
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke={pct > 0.4 ? "#f5c542" : "#fb7185"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
            <text
              x="32"
              y="32"
              textAnchor="middle"
              dominantBaseline="central"
              className="rotate-90"
              transform="rotate(90 32 32)"
              fill="white"
              fontSize="18"
              fontWeight="700"
            >
              {Math.ceil(Math.max(0, remaining) / 1000)}
            </text>
          </svg>
        </div>

        <h3 className="uu-display text-lg font-bold text-amber-200">A card was played!</h3>

        {reaction.targetCard && (
          <div className="my-3 flex items-center justify-center gap-3">
            <CardView card={reaction.targetCard} size="md" />
            <div className="text-left text-sm">
              <div className="font-semibold">{reaction.targetCard.name}</div>
              <div className="text-xs text-white/60">
                played by {playerName(reaction.targetByPlayer)}
              </div>
            </div>
          </div>
        )}

        {/* Neigh chain so far */}
        {reaction.chain.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-1 text-xs">
            {reaction.chain.map((link, i) => (
              <span
                key={i}
                className="rounded-full bg-amber-400/20 px-2 py-0.5 font-medium text-amber-200"
              >
                {playerName(link.byPlayer)}: {link.name}
              </span>
            ))}
            <span className="text-white/50">
              {reaction.chain.length % 2 === 1 ? "→ would be cancelled" : "→ would resolve"}
            </span>
          </div>
        )}

        {reaction.canRespond ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-2">
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
            <Button variant="secondary" size="sm" onClick={onPass} className="mt-1">
              <Ban className="size-4" /> Pass
            </Button>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Hand className="size-4" /> Waiting for other players to react…
          </p>
        )}
      </div>
    </div>
  );
}
