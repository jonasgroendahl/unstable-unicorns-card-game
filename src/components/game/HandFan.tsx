import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Hand, Play } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";
import { getCardPresentation } from "#/game/themes/cardPresentation.ts";
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
  const { themeId } = useGameTheme();
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      cards.findIndex((card) => card.instanceId === autoDrawnCardId),
    ),
  );
  const mobileRailRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const n = cards.length;
  const autoDrawnIndex = cards.findIndex((card) => card.instanceId === autoDrawnCardId);
  const activeCard = cards[Math.min(activeIndex, Math.max(0, cards.length - 1))];
  const activePresentation = activeCard ? getCardPresentation(themeId, activeCard) : null;
  const activePlayable =
    Boolean(activeCard) && canPlay && (isPlayable ? isPlayable(activeCard) : true);
  const activeReason = activeCard ? reasonFor?.(activeCard) : undefined;

  useEffect(() => {
    const nextIndex =
      autoDrawnIndex >= 0 ? autoDrawnIndex : Math.min(activeIndex, Math.max(0, n - 1));
    setActiveIndex(nextIndex);
    const frame = window.requestAnimationFrame(() => {
      const rail = mobileRailRef.current;
      const card = rail?.querySelector<HTMLElement>(`[data-hand-index="${nextIndex}"]`);
      card?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
    // Keep the current selection unless cards are added/removed or a new auto-drawn card arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDrawnIndex, n]);

  const scrollToCard = (index: number) => {
    const rail = mobileRailRef.current;
    const card = rail?.querySelector<HTMLElement>(`[data-hand-index="${index}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIndex(index);
  };

  const updateActiveFromScroll = () => {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const rail = mobileRailRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const element of rail.querySelectorAll<HTMLElement>("[data-hand-index]")) {
        const distance = Math.abs(element.offsetLeft + element.offsetWidth / 2 - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = Number(element.dataset.handIndex ?? 0);
        }
      }
      setActiveIndex(nearestIndex);
      scrollFrameRef.current = null;
    });
  };

  return (
    <>
      <div className="uu-hand uu-desktop-hand relative">
        {cards.map((card, i) => {
          const presentation = getCardPresentation(themeId, card);
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
                title={
                  reason
                    ? `${presentation.name} — ${reason}`
                    : `${presentation.name}\n\n${card.text}`
                }
              />
            </div>
          );
        })}
        {n === 0 && <span className="py-8 text-sm text-white/40">Your hand is empty</span>}
      </div>

      <section className="uu-mobile-hand sm:hidden" aria-label="Your hand">
        <div className="flex items-center gap-2 px-3 pb-1">
          <Hand className="size-4 text-amber-200" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-amber-100">
              {activePresentation?.name ?? "Your hand is empty"}
            </div>
            <div className="truncate text-[10px] text-white/50">
              {activeCard
                ? `${activeCard.cardClass} · ${activeIndex + 1} of ${n}${activeReason ? ` · ${activeReason}` : ""}`
                : "Draw a card to get started"}
            </div>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={activeIndex <= 0}
            aria-label="Previous card"
            onClick={() => scrollToCard(activeIndex - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={activeIndex >= n - 1}
            aria-label="Next card"
            onClick={() => scrollToCard(activeIndex + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div ref={mobileRailRef} className="uu-mobile-hand-rail" onScroll={updateActiveFromScroll}>
          {cards.map((card, index) => {
            const playable = canPlay && (isPlayable ? isPlayable(card) : true);
            const presentation = getCardPresentation(themeId, card);
            return (
              <div key={card.instanceId} data-hand-index={index} className="uu-mobile-hand-card">
                <CardView
                  card={card}
                  size="lg"
                  playable={playable}
                  disabled={!playable}
                  selected={index === activeIndex}
                  autoDrawn={card.instanceId === autoDrawnCardId}
                  onClick={() => scrollToCard(index)}
                  title={`${presentation.name}\n\n${card.text}`}
                />
              </div>
            );
          })}
          {n === 0 && (
            <span className="flex h-44 w-full items-center justify-center text-sm text-white/40">
              Your hand is empty
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 pt-1">
          <p className="line-clamp-2 min-w-0 flex-1 text-[10px] leading-snug text-white/55">
            {activeCard?.text ?? "Your cards will appear here."}
          </p>
          <Button
            type="button"
            size="lg"
            disabled={!activePlayable || !onPlay}
            onClick={() => activeCard && onPlay?.(activeCard)}
            className="min-w-24 bg-amber-400 text-black hover:bg-amber-300"
          >
            <Play data-icon="inline-start" />
            Play
          </Button>
        </div>
      </section>
    </>
  );
}
