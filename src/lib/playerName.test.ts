import { describe, expect, it, vi } from "vitest";
import {
  createUnicornName,
  loadOrCreatePlayerName,
  PLAYER_NAME_STORAGE_KEY,
  savePlayerName,
} from "./playerName";

function makeStorage(initialName?: string) {
  const values = new Map<string, string>();
  if (initialName !== undefined) values.set(PLAYER_NAME_STORAGE_KEY, initialName);

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe("player names", () => {
  it("creates a unicorn name within the input limit", () => {
    expect(createUnicornName(() => 0)).toBe("Cosmic Dreamhoof");
    expect(createUnicornName(() => 0.999)).toBe("Turbo Twinkle");
    expect(createUnicornName(() => 0.5).length).toBeLessThanOrEqual(20);
  });

  it("returns a stored player name", () => {
    const storage = makeStorage("  Neon Moonhorn  ");

    expect(loadOrCreatePlayerName(storage)).toBe("Neon Moonhorn");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("generates and stores a name when one is missing", () => {
    const storage = makeStorage();

    const name = loadOrCreatePlayerName(storage);

    expect(name).toBeTruthy();
    expect(storage.setItem).toHaveBeenCalledWith(PLAYER_NAME_STORAGE_KEY, name);
  });

  it("stores valid edits and ignores an empty name", () => {
    const storage = makeStorage();

    savePlayerName("  Royal Rainbow  ", storage);
    savePlayerName("   ", storage);

    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(storage.setItem).toHaveBeenCalledWith(PLAYER_NAME_STORAGE_KEY, "Royal Rainbow");
  });
});
