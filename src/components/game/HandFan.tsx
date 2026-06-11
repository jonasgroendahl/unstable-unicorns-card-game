import { cn } from "#/lib/utils.ts";
import { CardView } from "./CardView.tsx";
import type { CardView as CardViewData } from "#/game/view.ts";

interface HandFanProps {
  cards: CardViewData[];
  autoDrawnCardId?: string | null;
  canPlay: boolean;
  /** Per-card playability (e.g. instants only in reaction, upgrades under Broken Stable). */
  isPlayable?: (card: CardViewData) => boolean;
  reasonFor?: (card: CardViewData) => string | undefined;
  onPlay?: (card: CardViewData) => void;
}

export function HandFan({
  cards,
  autoDrawnCardId,
  canPlay,
  isPlayable,
  reasonFor,
  onPlay,
}: HandFanProps) {
  const n = cards.length;
  return (
    <div className="uu-hand relative">
      {cards.map((card, i) => {
        // Gentle arc: rotate cards outward from center.
        const mid = (n - 1) / 2;
        const offset = i - mid;
        const rotate = n > 1 ? offset * Math.min(4, 26 / n) : 0;
        const lift = Math.abs(offset) * 2;
        const playable = canPlay && (isPlayable ? isPlayable(card) : true);
        const reason = reasonFor?.(card);
        return (
          <div
            key={card.instanceId}
            className={cn("uu-hand-card")}
            style={{ transform: `rotate(${rotate}deg) translateY(${lift}px)`, zIndex: i }}
          >
            <CardView
              card={card}
              size="lg"
              playable={playable}
              disabled={!playable}
              autoDrawn={card.instanceId === autoDrawnCardId}
              onClick={playable && onPlay ? () => onPlay(card) : undefined}
              title={reason ? `${card.name} — ${reason}` : `${card.name}\n\n${card.text}`}
            />
          </div>
        );
      })}
      {n === 0 && <span className="py-8 text-sm text-white/40">Your hand is empty</span>}
    </div>
  );
}
