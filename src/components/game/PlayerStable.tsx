import { useState } from "react";
import { Crown, Bot, Sparkles, ShieldAlert, ArrowBigUp, Hand, MousePointer2 } from "lucide-react";
import { cn } from "#/lib/utils.ts";
import { CardView, type CardSize } from "./CardView.tsx";
import type { PlayerView, CardView as CardViewData } from "#/game/view.ts";

interface PlayerStableProps {
  player: PlayerView;
  winThreshold: number;
  cardSize?: CardSize;
  compact?: boolean;
  /** instanceIds currently selectable as targets. */
  targetableIds?: Set<string>;
  selectedIds?: Set<string>;
  onCardClick?: (card: CardViewData) => void;
  isViewer?: boolean;
  stableTargetable?: boolean;
  stablePreviewCard?: CardViewData;
  onStableClick?: (playerId: string) => void;
}

export function PlayerStable({
  player,
  winThreshold,
  cardSize = "sm",
  compact,
  targetableIds,
  selectedIds,
  onCardClick,
  isViewer,
  stableTargetable,
  stablePreviewCard,
  onStableClick,
}: PlayerStableProps) {
  const [isPreviewingPlacement, setIsPreviewingPlacement] = useState(false);
  const unicorns = player.stable.filter((c) => c.cardClass === "unicorn");
  const upgrades = player.stable.filter((c) => c.cardClass === "upgrade");
  const downgrades = player.stable.filter((c) => c.cardClass === "downgrade");
  const progress = Math.min(1, player.unicornCount / winThreshold);
  const showStablePreview = Boolean(stableTargetable && stablePreviewCard) && isPreviewingPlacement;
  const chooseStable = () => {
    if (stableTargetable) onStableClick?.(player.id);
  };

  return (
    <div
      className={cn(
        "uu-glass rounded-xl p-2 transition-all",
        player.isCurrent && "uu-glow-turn",
        stableTargetable && "uu-stable-target",
        compact ? "min-w-[150px]" : "min-w-[220px]",
      )}
      data-stable-previewing={showStablePreview ? "true" : undefined}
      aria-label={stableTargetable ? `Attach card to ${player.name}'s Stable` : undefined}
      role={stableTargetable ? "button" : undefined}
      tabIndex={stableTargetable ? 0 : undefined}
      onPointerEnter={() => stableTargetable && setIsPreviewingPlacement(true)}
      onPointerLeave={() => setIsPreviewingPlacement(false)}
      onFocus={() => stableTargetable && setIsPreviewingPlacement(true)}
      onBlur={() => setIsPreviewingPlacement(false)}
      onClick={chooseStable}
      onKeyDown={(event) => {
        if (!stableTargetable || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        chooseStable();
      }}
    >
      {/* header */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <div
          className={cn(
            "grid size-6 place-items-center rounded-full text-[11px] font-bold",
            player.isCurrent ? "bg-amber-400 text-black" : "bg-white/15 text-white",
          )}
        >
          {player.isBot ? <Bot className="size-3.5" /> : player.name.slice(0, 1).toUpperCase()}
        </div>
        <span className="truncate text-xs font-semibold">{player.name}</span>
        {isViewer && <span className="text-[10px] text-amber-200/80">(you)</span>}
        {!player.connected && <span className="text-[10px] text-rose-300">offline</span>}
        {!isViewer && (
          <span
            className="flex items-center gap-0.5 text-[10px] text-white/45"
            title={`${player.handCount} cards in hand`}
          >
            <Hand className="size-2.5" />
            {player.handCount}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Sparkles className="size-3 text-amber-300" />
          <span className="text-xs font-bold tabular-nums">
            {player.unicornCount}
            <span className="text-white/40">/{winThreshold}</span>
          </span>
          {player.unicornCount >= winThreshold && <Crown className="size-3.5 text-amber-300" />}
        </div>
      </div>

      {/* goal progress */}
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* unicorns */}
      <div className="flex flex-wrap gap-1">
        {unicorns.length === 0 && (
          <span className="text-[10px] text-white/40">No unicorns yet</span>
        )}
        {unicorns.map((c) => (
          <CardView
            key={c.instanceId}
            card={c}
            size={cardSize}
            targetable={targetableIds?.has(c.instanceId)}
            selected={selectedIds?.has(c.instanceId)}
            onClick={onCardClick ? () => onCardClick(c) : undefined}
            dealIn
          />
        ))}
      </div>

      {/* upgrades / downgrades */}
      {(upgrades.length > 0 || downgrades.length > 0 || showStablePreview) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-white/10 pt-1.5">
          {upgrades.map((c) => (
            <div key={c.instanceId} className="flex items-center">
              <ArrowBigUp className="size-3 text-emerald-300" />
              <CardView
                card={c}
                size="xs"
                targetable={targetableIds?.has(c.instanceId)}
                selected={selectedIds?.has(c.instanceId)}
                onClick={onCardClick ? () => onCardClick(c) : undefined}
              />
            </div>
          ))}
          {downgrades.map((c) => (
            <div key={c.instanceId} className="flex items-center">
              <ShieldAlert className="size-3 text-rose-300" />
              <CardView
                card={c}
                size="xs"
                targetable={targetableIds?.has(c.instanceId)}
                selected={selectedIds?.has(c.instanceId)}
                onClick={onCardClick ? () => onCardClick(c) : undefined}
              />
            </div>
          ))}
          {showStablePreview && stablePreviewCard && (
            <div className="uu-stable-placement-preview flex items-center gap-1">
              {stablePreviewCard.cardClass === "downgrade" ? (
                <ShieldAlert className="size-3 text-rose-300" />
              ) : (
                <ArrowBigUp className="size-3 text-emerald-300" />
              )}
              <CardView
                card={stablePreviewCard}
                size="xs"
                className="uu-placement-preview-card"
                previewOnly
              />
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-amber-100">
                <MousePointer2 className="size-2.5" />
                Place here
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
