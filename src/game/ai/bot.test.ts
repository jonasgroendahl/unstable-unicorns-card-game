import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DECK_ID } from "../decks";
import { GameEngine } from "../engine/GameEngine";
import { createInitialState } from "../state";
import { BOT_ACTION_DELAY_MS, runBots } from "./bot";

afterEach(() => {
  vi.useRealTimers();
});

describe("bot pacing", () => {
  it("waits before acting and coalesces duplicate prompts", async () => {
    vi.useFakeTimers();
    const state = createInitialState(
      [
        { id: "bot", name: "Bot", isBot: true },
        { id: "human", name: "Human", isBot: false },
      ],
      123,
      "paced-bot",
      DEFAULT_DECK_ID,
    );
    state.phase = "action";
    state.actionsRemaining = { plays: 1, draws: 0 };
    state.hands.bot = [];
    const engine = new GameEngine(state);

    runBots(engine);
    runBots(engine);

    await vi.advanceTimersByTimeAsync(BOT_ACTION_DELAY_MS - 1);
    expect(engine.state.turnNumber).toBe(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(engine.state.turnNumber).toBe(2);
    expect(engine.currentPlayerId()).toBe("human");
  });
});
