import { afterEach, describe, expect, it, vi } from "vitest";
import { getDefinition } from "../cards";
import { createInitialState } from "../state";
import { REACTION_WINDOW_MS, type GameState, type PlayerId } from "../types";
import { GameEngine } from "./GameEngine";
import { DEFAULT_DECK_ID } from "../decks";

afterEach(() => {
  vi.useRealTimers();
});

describe("reaction window timing", () => {
  it("keeps a human PvP Neigh window open for 20 seconds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T10:00:00Z"));

    const state = createInitialState(
      [
        { id: "p1", name: "Alice", isBot: false },
        { id: "p2", name: "Bob", isBot: false },
      ],
      12345,
      "reaction-timer-test",
      DEFAULT_DECK_ID,
    );
    const engine = new GameEngine(state);
    await engine.startTurn();
    const basic = giveCard(state, "p1", "basic-unicorn-blue");
    giveCard(state, "p2", "neigh");

    const play = engine.playCard("p1", basic);
    await vi.advanceTimersByTimeAsync(0);

    expect(state.reaction?.closesAt).toBe(Date.now() + REACTION_WINDOW_MS);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(state.reaction).not.toBeNull();

    await vi.advanceTimersByTimeAsync(REACTION_WINDOW_MS - 5_000);
    await play;
    expect(state.reaction).toBeNull();
  });

  it("opens a fresh human response window after every Neigh", async () => {
    const state = createInitialState(
      [
        { id: "p1", name: "Alice", isBot: false },
        { id: "p2", name: "Bob", isBot: false },
      ],
      12345,
      "counter-neigh-test",
      DEFAULT_DECK_ID,
    );
    const engine = new GameEngine(state);
    await engine.startTurn();
    const basic = giveCard(state, "p1", "basic-unicorn-blue");
    const firstNeigh = giveCard(state, "p2", "neigh");
    const counterNeigh = giveCard(state, "p1", "neigh");
    const thirdNeigh = giveCard(state, "p2", "neigh");
    const finalPassNeigh = giveCard(state, "p1", "neigh");

    const play = engine.playCard("p1", basic);
    await vi.waitFor(() => expect(state.reaction?.awaitingFrom).toContain("p2"));

    engine.submitReaction("p2", firstNeigh);
    await vi.waitFor(() => {
      expect(state.reaction?.chain).toHaveLength(1);
      expect(state.reaction?.awaitingFrom).toContain("p1");
    });

    engine.submitReaction("p1", counterNeigh);
    await vi.waitFor(() => {
      expect(state.reaction?.chain).toHaveLength(2);
      expect(state.reaction?.awaitingFrom).toContain("p2");
    });

    engine.submitReaction("p2", thirdNeigh);
    await vi.waitFor(() => {
      expect(state.reaction?.chain).toHaveLength(3);
      expect(state.reaction?.awaitingFrom).toContain("p1");
    });

    while (state.reaction) {
      const playerId = state.reaction.awaitingFrom[0];
      if (playerId) engine.submitReaction(playerId, null);
      await Promise.resolve();
    }
    await play;

    expect(state.instances[basic].zone).toBe("discard");
    expect([firstNeigh, counterNeigh, thirdNeigh].map((id) => state.instances[id].zone)).toEqual([
      "discard",
      "discard",
      "discard",
    ]);
    expect(state.instances[finalPassNeigh].zone).toBe("hand");
  });
});

function giveCard(state: GameState, playerId: PlayerId, slug: string): string {
  let instanceId = state.deck.find((id) => getDefinition(state.instances[id].defId).id === slug);

  if (instanceId) {
    state.deck.splice(state.deck.indexOf(instanceId), 1);
  } else {
    for (const hand of Object.values(state.hands)) {
      instanceId = hand.find((id) => getDefinition(state.instances[id].defId).id === slug);
      if (!instanceId) continue;
      hand.splice(hand.indexOf(instanceId), 1);
      break;
    }
  }

  if (!instanceId) throw new Error(`No ${slug} available`);
  state.instances[instanceId].zone = "hand";
  state.instances[instanceId].ownerId = playerId;
  state.hands[playerId].push(instanceId);
  return instanceId;
}
