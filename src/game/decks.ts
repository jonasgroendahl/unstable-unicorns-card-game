import { allDefinitions } from "./cards";
import type { CardDefinition } from "./types";

export const DECK_IDS = ["base-first-edition", "base-second-edition"] as const;
export type DeckId = (typeof DECK_IDS)[number];

export const DEFAULT_DECK_ID: DeckId = "base-first-edition";
export const EXPANSION_IDS = ["adventures-second-edition"] as const;
export type ExpansionId = (typeof EXPANSION_IDS)[number];
export const DEFAULT_EXPANSION_IDS: ExpansionId[] = [];

const FIRST_EDITION_ONLY = new Set([
  "angel-unicorn",
  "extremely-fertile-unicorn",
  "zombie-unicorn",
  "puppicorn",
  "unicorn-shrinkray",
  "summoning-ritual",
  "extra-tail",
  "unicorn-lasso",
  "rainbow-mane",
]);

const SECOND_EDITION_ONLY = new Set([
  "dark-angel-unicorn",
  "mother-goose-unicorn",
  "necromancer-unicorn",
  "unicorn-oracle",
  "kiss-of-life",
  "caffeine-overload",
  "claw-machine",
  "rainbow-lasso",
  "stable-artillery",
]);

/**
 * Cards removed from the deck for the official 2-player variant to keep the
 * game balanced. See https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Two_Player_Rules
 */
const TWO_PLAYER_EXCLUDED = new Set([
  // All Basic Unicorns.
  "basic-unicorn-blue",
  "basic-unicorn-green",
  "basic-unicorn-indigo",
  "basic-unicorn-orange",
  "basic-unicorn-purple",
  "basic-unicorn-red",
  "basic-unicorn-yellow",
  // Specific cards.
  "queen-bee-unicorn",
  "seductive-unicorn",
  "rainbow-unicorn",
  "nanny-cam",
  "sadistic-ritual",
  "slowdown",
  "yay",
  "mother-goose-unicorn",
  "necromancer-unicorn",
  // Adventures expansion.
  "eager-adventurer-unicorn",
  "glamping-unicorn",
  "indoor-rockclimber-unicorn",
  "land-lubber-unicorn",
  "stowaway-unicorn",
  "cutthroat-captain-unicorn",
  "extreme-adventurer-unicorn",
  "the-black-spot",
  "the-great-baby-heist",
]);

export interface DeckConfig {
  id: DeckId;
  name: string;
  shortName: string;
  description: string;
  cardCount: number;
}

export interface ExpansionConfig {
  id: ExpansionId;
  name: string;
  shortName: string;
  description: string;
  cardCount: number;
  image: string;
  sourceUrl: string;
}

export const DECKS: Record<DeckId, DeckConfig> = {
  "base-first-edition": {
    id: "base-first-edition",
    name: "Base Deck, First Generation",
    shortName: "First generation",
    description: "The original 2017 base deck currently used by the game.",
    cardCount: 127,
  },
  "base-second-edition": {
    id: "base-second-edition",
    name: "Base Deck, Second Edition",
    shortName: "Second edition",
    description: "The 2019 base deck with nine updated card replacements.",
    cardCount: 127,
  },
};

export const DECK_OPTIONS = DECK_IDS.map((id) => DECKS[id]);

export const EXPANSIONS: Record<ExpansionId, ExpansionConfig> = {
  "adventures-second-edition": {
    id: "adventures-second-edition",
    name: "Adventures Expansion, Second Edition",
    shortName: "Adventures",
    description: "Pirates, explorers, risky choices, and 54 extra cards for your base deck.",
    cardCount: 54,
    image: "/cards/adventures/cutthroat-captain-unicorn.png",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Expansion_-_Adventures_-_2nd_Edition_-_Cards_In_This_Deck",
  },
};

export const EXPANSION_OPTIONS = EXPANSION_IDS.map((id) => EXPANSIONS[id]);

export function isDeckId(value: string): value is DeckId {
  return DECK_IDS.includes(value as DeckId);
}

export function isExpansionId(value: string): value is ExpansionId {
  return EXPANSION_IDS.includes(value as ExpansionId);
}

export function definitionsForDeck(
  deckId: DeckId,
  playerCount?: number,
  expansionIds: readonly ExpansionId[] = DEFAULT_EXPANSION_IDS,
): CardDefinition[] {
  const excluded = deckId === "base-first-edition" ? SECOND_EDITION_ONLY : FIRST_EDITION_ONLY;
  const twoPlayer = playerCount === 2;
  const selectedExpansions = new Set(expansionIds);
  return allDefinitions().filter(
    (definition) =>
      (definition.setId === "base"
        ? !excluded.has(definition.id)
        : selectedExpansions.has(definition.setId)) &&
      !(twoPlayer && TWO_PLAYER_EXCLUDED.has(definition.id)),
  );
}

export function definitionsForExpansion(
  expansionId: ExpansionId,
  playerCount?: number,
): CardDefinition[] {
  const twoPlayer = playerCount === 2;
  return allDefinitions().filter(
    (definition) =>
      definition.setId === expansionId && !(twoPlayer && TWO_PLAYER_EXCLUDED.has(definition.id)),
  );
}

/** True if `cardId` is removed from the deck in the official 2-player variant. */
export function isExcludedInTwoPlayer(cardId: string): boolean {
  return TWO_PLAYER_EXCLUDED.has(cardId);
}
