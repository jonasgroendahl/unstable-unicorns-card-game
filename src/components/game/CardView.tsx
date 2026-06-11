import { Sparkles } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/ui/hover-card.tsx";
import { cn } from "#/lib/utils.ts";
import type { CardView as CardViewData } from "#/game/view.ts";

const KIND_LABEL: Record<string, string> = {
  baby: "Baby Unicorn",
  basic: "Basic Unicorn",
  magical: "Magical Unicorn",
  magic: "Magic",
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  instant: "Instant",
};

export type CardSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<CardSize, string> = {
  xs: "w-12 aspect-[5/7]",
  sm: "w-16 aspect-[5/7]",
  md: "w-24 aspect-[5/7]",
  lg: "w-40 aspect-[5/7]",
};

interface CardViewProps {
  card: CardViewData;
  size?: CardSize;
  playable?: boolean;
  disabled?: boolean;
  targetable?: boolean;
  selected?: boolean;
  dealIn?: boolean;
  autoDrawn?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function CardView({
  card,
  size = "md",
  playable,
  disabled,
  targetable,
  selected,
  dealIn,
  autoDrawn,
  className,
  onClick,
  title,
}: CardViewProps) {
  const cardTitle = title ?? `${card.name} — ${KIND_LABEL[card.kind] ?? card.kind}`;

  return (
    <HoverCard openDelay={180} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div
          className={cn("uu-card group", SIZES[size], dealIn && "uu-deal-in", className)}
          data-kind={card.kind}
          data-playable={playable ? "true" : undefined}
          data-disabled={disabled ? "true" : undefined}
          data-targetable={targetable ? "true" : undefined}
          data-selected={selected ? "true" : undefined}
          data-auto-drawn={autoDrawn ? "true" : undefined}
          data-previewable="true"
          aria-label={cardTitle}
          onClick={onClick}
          role={onClick ? "button" : undefined}
        >
          <img src={card.image} alt={card.name} loading="lazy" draggable={false} />
          {autoDrawn && (
            <span className="uu-auto-drawn-label">
              <Sparkles className="size-3" />
              Auto-drawn
            </span>
          )}
          {card.borrowed && (
            <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[9px] font-semibold text-amber-200">
              <Sparkles className="inline size-2.5" /> lasso
            </span>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        sideOffset={14}
        collisionPadding={16}
        className="uu-card-preview grid w-[min(29rem,calc(100vw-2rem))] grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border-white/20 bg-[#160d2c]/95 p-3 text-white shadow-2xl backdrop-blur-xl duration-200 sm:grid-cols-[14rem_minmax(0,1fr)]"
      >
        <div className="uu-card-preview-image aspect-[5/7] overflow-hidden rounded-xl">
          <img
            src={card.image}
            alt=""
            className="size-full object-cover"
            loading="eager"
            draggable={false}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3 p-1">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/75">
              <Sparkles className="size-3" />
              {KIND_LABEL[card.kind] ?? card.kind}
            </div>
            <h3 className="uu-display text-xl font-bold leading-tight text-amber-100">
              {card.name}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-white/80">{card.text}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Face-down card (hidden hand / deck). */
export function CardBack({ size = "md", count }: { size?: CardSize; count?: number }) {
  return (
    <div className={cn("uu-card uu-cardback", SIZES[size])}>
      <Sparkles className="size-5 text-amber-200/70" />
      {count !== undefined && (
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </div>
  );
}
