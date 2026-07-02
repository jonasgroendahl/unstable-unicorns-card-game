import { allDefinitions } from "./cards";
import type { CardDefinition } from "./types";

export const DECK_IDS = ["base-first-edition", "base-second-edition"] as const;
export type DeckId = (typeof DECK_IDS)[number];

export const DEFAULT_DECK_ID: DeckId = "base-first-edition";
export const EXPANSION_IDS = ["adventures-second-edition"] as const;
export type ExpansionId = (typeof EXPANSION_IDS)[number];
export const DEFAULT_EXPANSION_IDS: ExpansionId[] = [];

export const DECK_CATALOG_IDS = [
  "base-first-edition",
  "base-second-edition",
  "base-control",
  "base-chaos",
  "base-nsfw",
  "base-travel",
  "base-for-kids",
  "base-diamond-edition",
] as const;
export type DeckCatalogId = (typeof DECK_CATALOG_IDS)[number];

export const EXPANSION_CATALOG_IDS = [
  "adventures-second-edition",
  "expansion-nsfw",
  "expansion-rainbow-apocalypse",
  "expansion-dragons",
  "expansion-unicorns-of-legend",
  "expansion-christmas",
  "expansion-nightmares",
] as const;
export type ExpansionCatalogId = (typeof EXPANSION_CATALOG_IDS)[number];

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
  image: string;
  sourceUrl: string;
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

interface CatalogMetadata<Id extends string> {
  id: Id;
  name: string;
  shortName: string;
  description: string;
  image: string;
  sourceUrl: string;
}

export type DeckCatalogEntry =
  | (CatalogMetadata<DeckCatalogId> & {
      availability: "available";
      playableId: DeckId;
      cardCount: number;
    })
  | (CatalogMetadata<DeckCatalogId> & {
      availability: "unavailable";
    });

export type ExpansionCatalogEntry =
  | (CatalogMetadata<ExpansionCatalogId> & {
      availability: "available";
      playableId: ExpansionId;
      cardCount: number;
    })
  | (CatalogMetadata<ExpansionCatalogId> & {
      availability: "unavailable";
    });

export const DECKS: Record<DeckId, DeckConfig> = {
  "base-first-edition": {
    id: "base-first-edition",
    name: "Base Deck, First Generation",
    shortName: "First generation",
    description: "The original 2017 base deck currently used by the game.",
    cardCount: 127,
    image: "/decks/base-first.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Base_Deck_-_Original_Base",
  },
  "base-second-edition": {
    id: "base-second-edition",
    name: "Base Deck, Second Edition",
    shortName: "Second edition",
    description: "The 2019 base deck with nine updated card replacements.",
    cardCount: 127,
    image: "/decks/base-second.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Base_Deck_-_2nd_Edition",
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
    image: "/decks/expansion-adventures.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Adventures_Expansion",
  },
};

export const EXPANSION_OPTIONS = EXPANSION_IDS.map((id) => EXPANSIONS[id]);

export const DECK_CATALOG: readonly DeckCatalogEntry[] = [
  {
    ...DECKS["base-first-edition"],
    availability: "available",
    playableId: "base-first-edition",
  },
  {
    ...DECKS["base-second-edition"],
    availability: "available",
    playableId: "base-second-edition",
  },
  {
    id: "base-control",
    name: "Control Base Deck",
    shortName: "Control",
    description: "Protective magic and deck manipulation from the 2018 Kickstarter.",
    image: "/decks/base-control.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Base_Deck_-_Control_Base",
    availability: "unavailable",
  },
  {
    id: "base-chaos",
    name: "Chaos Base Deck",
    shortName: "Chaos",
    description: "Destructive magic and summoning cards built around the discard pile.",
    image: "/decks/base-chaos.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Base_Deck_-_Chaos_Base",
    availability: "unavailable",
  },
  {
    id: "base-nsfw",
    name: "NSFW Base Deck",
    shortName: "NSFW",
    description: "A complete adults-only base game with a thoroughly unfiltered stable.",
    image: "/decks/base-nsfw.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_NFSW_Base_Deck",
    availability: "unavailable",
  },
  {
    id: "base-travel",
    name: "Travel Deck",
    shortName: "Travel",
    description: "A compact adaptation designed for quicker games with 2–4 players.",
    image: "/decks/base-travel.webp",
    sourceUrl: "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Travel_Deck",
    availability: "unavailable",
  },
  {
    id: "base-for-kids",
    name: "Unstable Unicorns for Kids",
    shortName: "For Kids",
    description: "A younger-player edition with new characters and streamlined strategy.",
    image: "/decks/base-for-kids.webp",
    sourceUrl: "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_For_Kids",
    availability: "unavailable",
  },
  {
    id: "base-diamond-edition",
    name: "Diamond Edition",
    shortName: "Diamond",
    description: "A deluxe edition with four powerful Diamond Unicorns and a sparkle-core die.",
    image: "/decks/base-diamond.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_Diamond_Edition",
    availability: "unavailable",
  },
];

export const EXPANSION_CATALOG: readonly ExpansionCatalogEntry[] = [
  {
    ...EXPANSIONS["adventures-second-edition"],
    availability: "available",
    playableId: "adventures-second-edition",
  },
  {
    id: "expansion-nsfw",
    name: "NSFW Expansion Pack",
    shortName: "NSFW",
    description: "Fifty-four adults-only cards with optional party rules.",
    image: "/decks/expansion-nsfw.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_NFSW_Expansion",
    availability: "unavailable",
  },
  {
    id: "expansion-rainbow-apocalypse",
    name: "Rainbow Apocalypse Expansion Pack",
    shortName: "Rainbow Apocalypse",
    description: "Equal parts adorable destruction and apocalyptic mayhem.",
    image: "/decks/expansion-rainbow-apocalypse.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Rainbow_Apocalypse_Expansion",
    availability: "unavailable",
  },
  {
    id: "expansion-dragons",
    name: "Dragons Expansion Pack",
    shortName: "Dragons",
    description: "Dragon-themed Unicorns, magic, upgrades, and downgrades take flight.",
    image: "/decks/expansion-dragons.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Dragons_%28Retail%29",
    availability: "unavailable",
  },
  {
    id: "expansion-unicorns-of-legend",
    name: "Unicorns of Legend Expansion Pack",
    shortName: "Unicorns of Legend",
    description: "Battle-hardened Unicorns and potent magical spells join your army.",
    image: "/decks/expansion-legend.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Unicorns_of_Legend_Expansion",
    availability: "unavailable",
  },
  {
    id: "expansion-christmas",
    name: "Christmas Expansion Pack",
    shortName: "Christmas",
    description: "Holiday characters, magic, upgrades, and downgrades for a festive stable.",
    image: "/decks/expansion-christmas.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Christmas_Expansion",
    availability: "unavailable",
  },
  {
    id: "expansion-nightmares",
    name: "Nightmares Expansion Pack",
    shortName: "Nightmares",
    description: "Horror tropes, spooky Unicorns, and Nightmare Downgrade cards.",
    image: "/decks/expansion-nightmares.webp",
    sourceUrl:
      "https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Nightmares_Expansion",
    availability: "unavailable",
  },
];

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
