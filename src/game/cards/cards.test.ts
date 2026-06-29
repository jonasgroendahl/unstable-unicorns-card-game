import { describe, expect, it } from "vitest";
import { allDefinitions, getDefinition, hasBehavior } from "./index";
import { CARD_DATA } from "./cardData";
import { DECK_IDS, definitionsForDeck, definitionsForExpansion } from "../decks";

describe("card data integrity", () => {
  it("has a 127-card manifest for every supported deck", () => {
    expect(CARD_DATA.length).toBe(131);
    for (const deckId of DECK_IDS) {
      const definitions = definitionsForDeck(deckId);
      expect(definitions.length).toBe(84);
      expect(definitions.reduce((total, definition) => total + definition.copies, 0)).toBe(127);
    }
  });

  it("adds the complete 54-card Adventures expansion to either base deck", () => {
    const expansion = definitionsForExpansion("adventures-second-edition");
    expect(expansion).toHaveLength(38);
    expect(expansion.reduce((total, definition) => total + definition.copies, 0)).toBe(54);

    for (const deckId of DECK_IDS) {
      const combined = definitionsForDeck(deckId, undefined, ["adventures-second-edition"]);
      expect(combined.reduce((total, definition) => total + definition.copies, 0)).toBe(181);
    }
  });

  it("uses the official Adventures removals in a 2-player game", () => {
    const expansion = definitionsForExpansion("adventures-second-edition", 2);
    expect(expansion.reduce((total, definition) => total + definition.copies, 0)).toBe(36);
  });

  it("every card has a definition", () => {
    for (const c of CARD_DATA) {
      expect(() => getDefinition(c.slug)).not.toThrow();
    }
  });

  it("every non-vanilla card (not a Basic Unicorn) has implemented behavior", () => {
    const missing: string[] = [];
    for (const def of allDefinitions()) {
      // Basic Unicorns are intentionally vanilla (flavor text only).
      if (def.kind === "basic") continue;
      if (!hasBehavior(def)) missing.push(def.id);
    }
    expect(missing).toEqual([]);
  });

  it("every card has art", () => {
    for (const def of allDefinitions()) {
      expect(def.image).toMatch(/^\/cards\//);
    }
  });

  it("Baby Unicorns return to the Nursery instead of dying", () => {
    for (const def of allDefinitions()) {
      if (def.kind === "baby") {
        expect(def.replacement).toContain("babyReturn");
      }
    }
  });
});
