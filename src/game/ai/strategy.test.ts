import { describe, expect, it } from "vitest";
import { DEFAULT_DECK_ID } from "../decks";
import { createInitialState } from "../state";
import type {
  BotDifficulty,
  GameState,
  InstanceId,
  PendingDecision,
  PlayerId,
  Zone,
} from "../types";
import {
  chooseBotDecision,
  chooseBotReaction,
  createBotObservation,
  rankBotActions,
} from "./strategy";

let nextInstance = 0;

function makeState(difficulty?: BotDifficulty): GameState {
  const state = createInitialState(
    [
      { id: "bot", name: "Bot", isBot: true, botDifficulty: difficulty },
      { id: "human", name: "Human", isBot: false },
    ],
    123,
    `strategy-${difficulty ?? "legacy"}`,
    DEFAULT_DECK_ID,
  );
  clearHand(state, "bot");
  clearHand(state, "human");
  state.phase = "action";
  state.actionsRemaining = { plays: 1, draws: 0 };
  return state;
}

function clearHand(state: GameState, playerId: PlayerId): void {
  for (const id of state.hands[playerId]) {
    state.instances[id].ownerId = null;
    state.instances[id].zone = "deck";
    state.deck.push(id);
  }
  state.hands[playerId] = [];
}

function addCard(
  state: GameState,
  playerId: PlayerId,
  defId: string,
  zone: Extract<Zone, "hand" | "stable">,
): InstanceId {
  const instanceId = `ai-test-${nextInstance++}`;
  state.instances[instanceId] = { instanceId, defId, ownerId: playerId, zone };
  if (zone === "hand") state.hands[playerId].push(instanceId);
  else state.stables[playerId].push(instanceId);
  return instanceId;
}

function setUnicornCount(state: GameState, playerId: PlayerId, count: number): void {
  while (state.stables[playerId].length < count) {
    addCard(state, playerId, "basic-unicorn-red", "stable");
  }
}

function setDecision(state: GameState, decision: PendingDecision): void {
  state.pendingDecisions = [decision];
}

describe("difficulty-aware bot strategy", () => {
  it("defaults legacy/debug-created bots to easy and preserves the easy card priority", () => {
    const state = makeState();
    const basic = addCard(state, "bot", "basic-unicorn-red", "hand");
    addCard(state, "bot", "double-dutch", "hand");

    const observation = createBotObservation(state, "bot");

    expect(observation.difficulty).toBe("easy");
    expect(rankBotActions(observation)[0]).toMatchObject({ kind: "play", instanceId: basic });
  });

  it("values permanent engines on medium and draws instead of exposing a weak hard play", () => {
    const medium = makeState("medium");
    const engine = addCard(medium, "bot", "double-dutch", "hand");
    addCard(medium, "bot", "basic-unicorn-red", "hand");
    expect(rankBotActions(createBotObservation(medium, "bot"))[0]).toMatchObject({
      kind: "play",
      instanceId: engine,
    });

    const hard = makeState("hard");
    setUnicornCount(hard, "bot", 4);
    addCard(hard, "bot", "basic-unicorn-red", "hand");
    expect(rankBotActions(createBotObservation(hard, "bot"))[0].kind).toBe("draw");
  });

  it("prioritizes an immediate win and suppresses opponents near victory", () => {
    const winning = makeState("hard");
    setUnicornCount(winning, "bot", 6);
    const winner = addCard(winning, "bot", "basic-unicorn-red", "hand");
    expect(rankBotActions(createBotObservation(winning, "bot"))[0]).toMatchObject({
      kind: "play",
      instanceId: winner,
    });

    const defensive = makeState("hard");
    setUnicornCount(defensive, "human", 5);
    const downgrade = addCard(defensive, "bot", "slowdown", "hand");
    addCard(defensive, "bot", "double-dutch", "hand");
    expect(rankBotActions(createBotObservation(defensive, "bot"))[0]).toMatchObject({
      kind: "play",
      instanceId: downgrade,
    });
  });

  it("uses typed intent to keep valuable cards and attach benefits to itself", () => {
    const state = makeState("hard");
    const basic = addCard(state, "bot", "basic-unicorn-red", "stable");
    const yay = addCard(state, "bot", "yay", "stable");
    setDecision(state, {
      id: "sacrifice",
      playerId: "bot",
      kind: "chooseInstance",
      prompt: "Choose a cost.",
      options: [yay, basic],
      minMax: [1, 1],
      intent: "cost",
    });
    expect(chooseBotDecision(createBotObservation(state, "bot"))).toBe(basic);

    setDecision(state, {
      id: "attach",
      playerId: "bot",
      kind: "choosePlayer",
      prompt: "Choose a Stable.",
      options: ["human", "bot"],
      intent: "support",
    });
    expect(chooseBotDecision(createBotObservation(state, "bot"))).toBe("bot");
  });

  it("conserves Neighs, blocks wins, and counter-Neighs its own winning play", () => {
    const state = makeState("hard");
    const neigh = addCard(state, "bot", "neigh", "hand");
    const target = addCard(state, "human", "basic-unicorn-red", "hand");
    state.reaction = {
      kind: "neigh",
      targetInstanceId: target,
      targetByPlayer: "human",
      chain: [],
      awaitingFrom: ["bot"],
      closesAt: Date.now() + 1_000,
    };
    expect(chooseBotReaction(createBotObservation(state, "bot"))).toBeNull();

    setUnicornCount(state, "human", 6);
    expect(chooseBotReaction(createBotObservation(state, "bot"))).toBe(neigh);

    const ownWinningCard = addCard(state, "bot", "basic-unicorn-blue", "hand");
    const opposingNeigh = addCard(state, "human", "neigh", "hand");
    setUnicornCount(state, "bot", 6);
    state.reaction = {
      kind: "neigh",
      targetInstanceId: ownWinningCard,
      targetByPlayer: "bot",
      chain: [{ instanceId: opposingNeigh, byPlayer: "human" }],
      awaitingFrom: ["bot"],
      closesAt: Date.now() + 1_000,
    };
    expect(chooseBotReaction(createBotObservation(state, "bot"))).toBe(neigh);
  });

  it("is deterministic and cannot observe hidden opponent card identities", () => {
    const first = makeState("medium");
    addCard(first, "bot", "double-dutch", "hand");
    addCard(first, "bot", "basic-unicorn-red", "hand");
    const hidden = addCard(first, "human", "yay", "hand");
    const second = structuredClone(first);
    second.instances[hidden].defId = "basic-unicorn-blue";

    const firstObservation = createBotObservation(first, "bot");
    const secondObservation = createBotObservation(second, "bot");

    expect(firstObservation.cards[hidden]).toBeUndefined();
    expect(secondObservation.cards[hidden]).toBeUndefined();
    expect(rankBotActions(firstObservation)).toEqual(rankBotActions(firstObservation));
    expect(rankBotActions(firstObservation)).toEqual(rankBotActions(secondObservation));
  });
});
