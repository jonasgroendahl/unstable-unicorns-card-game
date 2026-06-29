// Card registry: merges the auto-generated CardData (name/kind/text/art/copies)
// with hand-authored effect behavior into a single CardDefinition per slug.

import type { CardClass, CardDefinition, CardKind } from "../types";
import { CARD_DATA } from "./cardData";
import { UNICORN_EFFECTS } from "./effects/unicorns";
import { MAGIC_EFFECTS } from "./effects/magic";
import { UPGRADE_EFFECTS } from "./effects/upgrades";
import { DOWNGRADE_EFFECTS } from "./effects/downgrades";
import { INSTANT_EFFECTS, BABY_BEHAVIOR } from "./effects/instants";
import { ADVENTURES_EFFECTS } from "./effects/adventures";

type Behavior = Partial<
  Pick<
    CardDefinition,
    | "triggers"
    | "play"
    | "aura"
    | "replacement"
    | "canPlay"
    | "unneighable"
    | "instantKind"
    | "grantsExtraPlays"
    | "grantsExtraDraws"
    | "unicornValue"
    | "cantBeDestroyedByMagic"
    | "cantBeSacrificedOrDestroyed"
  >
>;

function classFor(kind: CardKind): CardClass {
  switch (kind) {
    case "baby":
    case "basic":
    case "magical":
      return "unicorn";
    case "magic":
      return "magic";
    case "upgrade":
      return "upgrade";
    case "downgrade":
      return "downgrade";
    case "instant":
      return "instant";
  }
}

function behaviorFor(slug: string, kind: CardKind): Behavior {
  if (kind === "baby") return BABY_BEHAVIOR;
  return (
    UNICORN_EFFECTS[slug] ??
    MAGIC_EFFECTS[slug] ??
    UPGRADE_EFFECTS[slug] ??
    DOWNGRADE_EFFECTS[slug] ??
    INSTANT_EFFECTS[slug] ??
    ADVENTURES_EFFECTS[slug] ??
    {}
  );
}

const DEFINITIONS: Record<string, CardDefinition> = {};

for (const data of CARD_DATA) {
  DEFINITIONS[data.slug] = {
    id: data.slug,
    name: data.name,
    kind: data.kind,
    cardClass: classFor(data.kind),
    text: data.text,
    image: data.image,
    copies: data.copies,
    setId: data.setId,
    ...behaviorFor(data.slug, data.kind),
  };
}

export function getDefinition(slug: string): CardDefinition {
  const def = DEFINITIONS[slug];
  if (!def) throw new Error(`Unknown card definition: ${slug}`);
  return def;
}

export function allDefinitions(): CardDefinition[] {
  return Object.values(DEFINITIONS);
}

/** True if a card has any rules behavior (vs. a vanilla Basic Unicorn). */
export function hasBehavior(def: CardDefinition): boolean {
  // Instant cards (Neigh / Super Neigh) are fully handled by the reaction system,
  // so they count as implemented even without effect flags.
  if (def.cardClass === "instant") return true;
  return Boolean(
    def.triggers ||
    def.play ||
    def.aura ||
    def.replacement ||
    def.grantsExtraPlays ||
    def.grantsExtraDraws ||
    def.cantBeDestroyedByMagic ||
    def.cantBeSacrificedOrDestroyed,
  );
}
