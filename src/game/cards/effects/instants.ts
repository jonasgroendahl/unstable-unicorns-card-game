// Effect hooks for Instant cards (Neigh / Super Neigh).
//
// Instants have no `play` effect of their own — their entire behavior is handled
// by the reaction-window resolver (engine/reactions.ts), which cancels the target
// card and discards both. We only need to flag Super Neigh as unneighable.

import type { CardDefinition } from "../../types";

type Behavior = Partial<Pick<CardDefinition, "unneighable" | "instantKind">>;

export const INSTANT_EFFECTS: Record<string, Behavior> = {
  neigh: { instantKind: "neigh" },
  "super-neigh": { instantKind: "neigh", unneighable: true },
  "neigh-mate": { instantKind: "neigh" },
  "fishing-rod": { instantKind: "fishingRod" },
  "flare-gun": { instantKind: "flareGun" },
  "unicorn-net": { instantKind: "unicornNet" },
};

// Baby Unicorns: "If this would be sacrificed, destroyed, or returned to your
// hand, return it to the Nursery instead." Modeled as the babyReturn replacement,
// applied to every baby slug by the registry.
export const BABY_BEHAVIOR: Partial<Pick<CardDefinition, "replacement">> = {
  replacement: ["babyReturn"],
};
