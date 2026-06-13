import type { GameThemeId } from "#/lib/gameTheme.ts";
import { UNHINGED_HEDGEHOG_CARDS, type HedgehogCardPresentation } from "./unhingedHedgehogs.ts";

export interface CardPresentationSource {
  id?: string;
  slug?: string;
  name: string;
  image: string;
}

const HEDGEHOG_CARDS: Record<string, HedgehogCardPresentation> = UNHINGED_HEDGEHOG_CARDS;

const DEFAULT_KIND_LABELS: Record<string, string> = {
  baby: "Baby Unicorn",
  basic: "Basic Unicorn",
  magical: "Magical Unicorn",
  magic: "Magic",
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  instant: "Instant",
};

const HEDGEHOG_KIND_LABELS: Record<string, string> = {
  baby: "Hedgelet",
  basic: "Everyday Hedgehog",
  magical: "Unhinged Hedgehog",
  magic: "Mayhem",
  upgrade: "Bright Idea",
  downgrade: "Bad Idea",
  instant: "Interruption",
};

export function getCardPresentation(
  themeId: GameThemeId,
  card: CardPresentationSource,
): HedgehogCardPresentation {
  const slug = card.slug ?? card.id;
  if (themeId === "unhinged-hedgehogs" && slug) {
    return HEDGEHOG_CARDS[slug] ?? card;
  }
  return card;
}

export function getCardKindLabel(themeId: GameThemeId, kind: string): string {
  const labels = themeId === "unhinged-hedgehogs" ? HEDGEHOG_KIND_LABELS : DEFAULT_KIND_LABELS;
  return labels[kind] ?? kind;
}
