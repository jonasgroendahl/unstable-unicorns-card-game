import { describe, expect, it } from "vitest";
import { allDefinitions, getDefinition, hasBehavior } from "./index";
import { CARD_DATA } from "./cardData";

describe("card data integrity", () => {
  it("has 84 distinct cards and 127 total copies", () => {
    expect(CARD_DATA.length).toBe(84);
    expect(CARD_DATA.reduce((n, c) => n + c.copies, 0)).toBe(127);
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
