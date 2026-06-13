import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_THEME_ID, GAME_THEME_IDS, GAME_THEMES, isGameThemeId } from "./gameTheme.ts";

describe("game themes", () => {
  it("defines complete theme entries with four featured assets", () => {
    for (const id of GAME_THEME_IDS) {
      const theme = GAME_THEMES[id];
      expect(theme.id).toBe(id);
      expect(theme.name).toBeTruthy();
      expect(theme.mark).toMatch(/^\//);
      expect(theme.featuredArt).toHaveLength(4);
    }
  });

  it("validates persisted theme ids", () => {
    expect(isGameThemeId(DEFAULT_GAME_THEME_ID)).toBe(true);
    expect(isGameThemeId("unhinged-hedgehogs")).toBe(true);
    expect(isGameThemeId("unknown-theme")).toBe(false);
    expect(isGameThemeId(null)).toBe(false);
  });
});
