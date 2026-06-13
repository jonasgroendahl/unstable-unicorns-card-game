import {
  ArrowDownCircle,
  ArrowUpCircle,
  Egg,
  Sparkles,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getCardKindLabel } from "#/game/themes/cardPresentation.ts";
import type { CardView as CardViewData } from "#/game/view.ts";

const KIND_ICON: Record<string, LucideIcon> = {
  baby: Egg,
  basic: Sparkles,
  magical: Zap,
  magic: WandSparkles,
  upgrade: ArrowUpCircle,
  downgrade: ArrowDownCircle,
  instant: Zap,
};

interface HedgehogCardFaceProps {
  card: CardViewData;
}

export function HedgehogCardFace({ card }: HedgehogCardFaceProps) {
  const KindIcon = KIND_ICON[card.kind] ?? Sparkles;

  return (
    <div className="uh-card-face" data-kind={card.kind}>
      <header className="uh-card-header">
        <KindIcon aria-hidden="true" />
        <strong>{card.name}</strong>
      </header>
      <div className="uh-card-art">
        <img src={card.image} alt="" loading="lazy" draggable={false} />
        <span className="uh-card-stamp" aria-hidden="true">
          UH
        </span>
      </div>
      <div className="uh-card-rules">
        <p>{card.text}</p>
      </div>
      <footer className="uh-card-footer">
        <span>{getCardKindLabel("unhinged-hedgehogs", card.kind)}</span>
        <span aria-hidden="true">UH</span>
      </footer>
    </div>
  );
}
