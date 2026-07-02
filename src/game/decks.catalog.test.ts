import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DECK_CATALOG,
  DECK_CATALOG_IDS,
  DECK_IDS,
  EXPANSION_CATALOG,
  EXPANSION_CATALOG_IDS,
  EXPANSION_IDS,
  isDeckId,
  isExpansionId,
} from "./decks.ts";

describe("deck and expansion catalog", () => {
  it("lists each product family once", () => {
    expect(DECK_CATALOG.map((entry) => entry.id)).toEqual(DECK_CATALOG_IDS);
    expect(EXPANSION_CATALOG.map((entry) => entry.id)).toEqual(EXPANSION_CATALOG_IDS);
    expect(new Set(DECK_CATALOG_IDS).size).toBe(8);
    expect(new Set(EXPANSION_CATALOG_IDS).size).toBe(7);
  });

  it("maps only implemented products to playable ids", () => {
    expect(
      DECK_CATALOG.filter((entry) => entry.availability === "available").map(
        (entry) => entry.playableId,
      ),
    ).toEqual(DECK_IDS);
    expect(
      EXPANSION_CATALOG.filter((entry) => entry.availability === "available").map(
        (entry) => entry.playableId,
      ),
    ).toEqual(EXPANSION_IDS);

    for (const entry of DECK_CATALOG.filter((product) => product.availability === "unavailable")) {
      expect(isDeckId(entry.id)).toBe(false);
      expect("playableId" in entry).toBe(false);
    }
    for (const entry of EXPANSION_CATALOG.filter(
      (product) => product.availability === "unavailable",
    )) {
      expect(isExpansionId(entry.id)).toBe(false);
      expect("playableId" in entry).toBe(false);
    }
  });

  it("uses complete local product metadata", () => {
    for (const entry of [...DECK_CATALOG, ...EXPANSION_CATALOG]) {
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.sourceUrl).toMatch(/^https:\/\/www\.unstablegameswiki\.com\//);
      expect(entry.image).toMatch(/^\/decks\/.+\.webp$/);
      expect(
        existsSync(fileURLToPath(new URL(`../../public${entry.image}`, import.meta.url))),
      ).toBe(true);
    }
  });
});
