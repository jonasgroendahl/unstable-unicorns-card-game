import { describe, expect, it } from "vitest";
import { definitionsForDeck } from "../decks.ts";
import { getCardPresentation } from "./cardPresentation.ts";
import { UNHINGED_HEDGEHOG_CARDS } from "./unhingedHedgehogs.ts";

describe("Unhinged Hedgehogs card presentation", () => {
  const firstGeneration = definitionsForDeck("base-first-edition");

  it("renames and illustrates every first-generation card", () => {
    expect(Object.keys(UNHINGED_HEDGEHOG_CARDS)).toHaveLength(84);

    for (const card of firstGeneration) {
      const presentation = getCardPresentation("unhinged-hedgehogs", card);
      expect(presentation.name).not.toBe(card.name);
      expect(presentation.image).toBe(`/themes/unhinged-hedgehogs/cards/${card.id}.svg`);
    }
  });

  it("keeps every hedgehog name and illustration path unique", () => {
    const presentations = Object.values(UNHINGED_HEDGEHOG_CARDS);
    expect(new Set(presentations.map((card) => card.name)).size).toBe(84);
    expect(new Set(presentations.map((card) => card.image)).size).toBe(84);
  });

  it("leaves the original presentation untouched in the original theme", () => {
    for (const card of firstGeneration) {
      expect(getCardPresentation("unstable-unicorns", card)).toBe(card);
    }
  });
});
