import { afterEach, describe, expect, it, vi } from "vitest";
import { audio } from "./audio";

describe("audio preferences", () => {
  const initialPrefs = audio.prefs;

  afterEach(() => {
    audio.setMuted(initialPrefs.muted);
    audio.setSfxVolume(initialPrefs.sfxVolume);
    audio.setMusicVolume(initialPrefs.musicVolume);
  });

  it("publishes a new snapshot when a slider changes", () => {
    const previous = audio.prefs;
    const listener = vi.fn();
    const unsubscribe = audio.subscribe(listener);

    audio.setSfxVolume(0.25);

    expect(audio.prefs).not.toBe(previous);
    expect(audio.prefs.sfxVolume).toBe(0.25);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("clamps volume values", () => {
    audio.setMusicVolume(2);
    expect(audio.prefs.musicVolume).toBe(1);

    audio.setMusicVolume(-1);
    expect(audio.prefs.musicVolume).toBe(0);
  });
});
