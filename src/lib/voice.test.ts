// @vitest-environment jsdom

import { beforeEach, expect, it } from "vitest";
import { isVoiceToggleShortcut, readMutedPlayers, writeMutedPlayers } from "./voicePreferences.ts";

beforeEach(() => sessionStorage.clear());

function shortcut(overrides: Partial<KeyboardEvent> = {}) {
  return isVoiceToggleShortcut({
    key: "m",
    repeat: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    defaultPrevented: false,
    target: document.body,
    ...overrides,
  });
}

it("accepts an unmodified M key and ignores repeats or modified shortcuts", () => {
  expect(shortcut()).toBe(true);
  expect(shortcut({ key: "M" })).toBe(true);
  expect(shortcut({ repeat: true })).toBe(false);
  expect(shortcut({ ctrlKey: true })).toBe(false);
  expect(shortcut({ metaKey: true })).toBe(false);
  expect(shortcut({ altKey: true })).toBe(false);
  expect(shortcut({ defaultPrevented: true })).toBe(false);
  expect(shortcut({ key: "n" })).toBe(false);
});

it("does not toggle voice while typing or editing content", () => {
  const input = document.createElement("input");
  const editor = document.createElement("div");
  editor.setAttribute("contenteditable", "true");
  document.body.append(input, editor);

  expect(shortcut({ target: input })).toBe(false);
  expect(shortcut({ target: editor })).toBe(false);
});

it("persists personal mutes per game and tolerates malformed storage", () => {
  writeMutedPlayers("game-a", new Set(["bob", "carol"]));

  expect(readMutedPlayers("game-a")).toEqual(new Set(["bob", "carol"]));
  expect(readMutedPlayers("game-b")).toEqual(new Set());

  sessionStorage.setItem("uu.voice.muted.game-a", "{broken");
  expect(readMutedPlayers("game-a")).toEqual(new Set());
});
