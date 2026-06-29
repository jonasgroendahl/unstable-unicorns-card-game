import { describe, expect, it, vi } from "vitest";
import { getDefinition } from "../cards";
import { createInitialState } from "../state";
import type { GameState, PlayerId, Zone } from "../types";
import { GameEngine } from "./GameEngine";

const SEATS = [
  { id: "p1", name: "Alice", isBot: false },
  { id: "p2", name: "Bob", isBot: false },
  { id: "p3", name: "Cara", isBot: false },
];

function makeEngine() {
  const state = createInitialState(SEATS, 12345, "adventures-test", "base-second-edition", [
    "adventures-second-edition",
  ]);
  for (const player of SEATS) {
    for (const id of state.hands[player.id]) {
      state.instances[id].zone = "deck";
      state.instances[id].ownerId = null;
      state.deck.push(id);
    }
    state.hands[player.id] = [];
  }
  return { state, engine: new GameEngine(state) };
}

function moveCard(
  state: GameState,
  slug: string,
  ownerId: PlayerId,
  zone: Extract<Zone, "hand" | "stable">,
): string {
  const id = state.deck.find(
    (candidate) => getDefinition(state.instances[candidate].defId).id === slug,
  );
  if (!id) throw new Error(`Missing test card: ${slug}`);
  state.deck.splice(state.deck.indexOf(id), 1);
  state.instances[id].zone = zone;
  state.instances[id].ownerId = ownerId;
  state[zone === "hand" ? "hands" : "stables"][ownerId].push(id);
  return id;
}

describe("Adventures specialty Instant cards", () => {
  it("Fishing Rod redirects a stolen card into the responder's Stable", async () => {
    const { state, engine } = makeEngine();
    const target = moveCard(state, "basic-unicorn-red", "p2", "stable");
    const fishingRod = moveCard(state, "fishing-rod", "p3", "hand");

    const steal = engine.steal(target, "p1");
    await vi.waitFor(() => expect(state.reaction?.kind).toBe("fishingRod"));
    engine.submitReaction("p3", fishingRod);
    await steal;

    expect(state.instances[target]).toMatchObject({ ownerId: "p3", zone: "stable" });
    expect(state.instances[fishingRod].zone).toBe("discard");
  });

  it("Unicorn Net catches a card that would be sacrificed", async () => {
    const { state, engine } = makeEngine();
    const target = moveCard(state, "basic-unicorn-red", "p1", "stable");
    const unicornNet = moveCard(state, "unicorn-net", "p2", "hand");

    const sacrifice = engine.sacrifice(target);
    await vi.waitFor(() => expect(state.reaction?.kind).toBe("unicornNet"));
    engine.submitReaction("p2", unicornNet);
    const result = await sacrifice;

    expect(result).toEqual({ removed: false, prevented: true });
    expect(state.instances[target]).toMatchObject({ ownerId: "p2", zone: "hand" });
  });

  it("Flare Gun skips another player's Beginning and Draw phases", async () => {
    const { state, engine } = makeEngine();
    const flareGun = moveCard(state, "flare-gun", "p2", "hand");

    const turn = engine.startTurn();
    await vi.waitFor(() => expect(state.reaction?.kind).toBe("flareGun"));
    engine.submitReaction("p2", flareGun);
    await turn;

    expect(state.phase).toBe("action");
    expect(state.lastAutoDrawn).toBeNull();
    expect(state.hands.p1).toHaveLength(0);
    expect(state.instances[flareGun].zone).toBe("discard");
  });

  it("does not offer specialty Instants as Neigh cards", async () => {
    const { state, engine } = makeEngine();
    const card = moveCard(state, "basic-unicorn-red", "p1", "hand");
    moveCard(state, "fishing-rod", "p2", "hand");
    state.phase = "action";

    await engine.playCard("p1", card);

    expect(state.instances[card].zone).toBe("stable");
    expect(state.reaction).toBeNull();
  });
});
