import { describe, expect, it } from "vitest";
import { definitionsForDeck } from "../decks";
import type { PendingDecision } from "../types";
import { Harness } from "./testHarness";

const SECOND_EDITION = "base-second-edition";

describe("second-edition deck manifest", () => {
  it("swaps the nine first-generation cards for their replacements", () => {
    const ids = new Set(definitionsForDeck(SECOND_EDITION).map((definition) => definition.id));

    expect(ids).toContain("dark-angel-unicorn");
    expect(ids).toContain("stable-artillery");
    expect(ids).not.toContain("angel-unicorn");
    expect(ids).not.toContain("rainbow-mane");
  });
});

describe("second-edition Magical Unicorns", () => {
  it("Dark Angel sacrifices a Unicorn, then revives one", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const sacrifice = h.giveStable("p1", "basic-unicorn-red");
    const revived = moveCardToDiscard(h, "rainbow-unicorn");
    const darkAngel = h.giveCard("p1", "dark-angel-unicorn");
    h.setDecide((decision) => choosePreferred(decision, [revived, sacrifice]));

    await h.play("p1", darkAngel);

    expect(h.state.instances[sacrifice].zone).toBe("discard");
    expect(h.state.instances[revived]).toMatchObject({ zone: "stable", ownerId: "p1" });
  });

  it("Mother Goose brings a Baby Unicorn from the Nursery", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const mother = h.giveCard("p1", "mother-goose-unicorn");
    const babiesBefore = h.state.stables.p1.filter((id) =>
      h.state.instances[id].defId.startsWith("baby-"),
    ).length;

    await h.play("p1", mother);

    const babiesAfter = h.state.stables.p1.filter((id) =>
      h.state.instances[id].defId.startsWith("baby-"),
    ).length;
    expect(babiesAfter).toBe(babiesBefore + 1);
  });

  it("Necromancer discards two Unicorn cards, then revives one", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    h.giveCard("p1", "basic-unicorn-red");
    h.giveCard("p1", "basic-unicorn-blue");
    const revived = moveCardToDiscard(h, "rainbow-unicorn");
    const necromancer = h.giveCard("p1", "necromancer-unicorn");
    h.setDecide((decision) => choosePreferred(decision, [revived]));

    await h.play("p1", necromancer);

    expect(h.state.instances[revived]).toMatchObject({ zone: "stable", ownerId: "p1" });
  });

  it("Unicorn Oracle takes one of the top three cards and reorders the other two", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    h.state.actionsRemaining.plays = 2;
    const oracle = h.giveCard("p1", "unicorn-oracle");
    const topThree = h.state.deck.slice(-3);
    const take = topThree[0];
    const onTop = topThree[1];
    h.setDecide((decision) => choosePreferred(decision, [take, onTop]));

    await h.play("p1", oracle);

    expect(h.state.hands.p1).toContain(take);
    expect(h.state.deck.slice(-2)).toEqual([topThree[2], onTop]);
  });
});

describe("second-edition Magic and Upgrades", () => {
  it("Kiss of Life brings a Unicorn from the discard pile into your Stable", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const revived = moveCardToDiscard(h, "rainbow-unicorn");
    const kiss = h.giveCard("p1", "kiss-of-life");
    h.setDecide((decision) => choosePreferred(decision, [revived]));

    await h.play("p1", kiss);

    expect(h.state.instances[revived]).toMatchObject({ zone: "stable", ownerId: "p1" });
  });

  it("Caffeine Overload sacrifices a card, then draws two cards", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const sacrifice = h.giveStable("p1", "basic-unicorn-red");
    h.giveStable("p1", "caffeine-overload");
    const handBefore = h.state.hands.p1.length;
    h.setDecide((decision) => choosePreferred(decision, [sacrifice]));

    await returnToPlayerOne(h);

    expect(h.state.instances[sacrifice].zone).toBe("discard");
    expect(h.state.hands.p1.length).toBe(handBefore + 3);
  });

  it("Claw Machine discards a card, then draws a card", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const discard = h.giveCard("p1", "basic-unicorn-red");
    h.giveStable("p1", "claw-machine");
    const handBefore = h.state.hands.p1.length;
    h.setDecide((decision) => choosePreferred(decision, [discard]));

    await returnToPlayerOne(h);

    expect(h.state.instances[discard].zone).toBe("discard");
    expect(h.state.hands.p1.length).toBe(handBefore + 1);
  });

  it("Rainbow Lasso discards three cards, then steals a Unicorn", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const victim = h.giveStable("p2", "rainbow-unicorn");
    h.giveStable("p1", "rainbow-lasso");
    h.setDecide((decision) => choosePreferred(decision, [victim]));

    await returnToPlayerOne(h);

    expect(h.state.instances[victim]).toMatchObject({ zone: "stable", ownerId: "p1" });
  });

  it("Stable Artillery discards two cards, then destroys a Unicorn", async () => {
    const h = new Harness({ deckId: SECOND_EDITION });
    await h.start();
    const victim = h.giveStable("p2", "rainbow-unicorn");
    h.giveStable("p1", "stable-artillery");
    h.setDecide((decision) => choosePreferred(decision, [victim]));

    await returnToPlayerOne(h);

    expect(h.state.instances[victim].zone).toBe("discard");
  });
});

function choosePreferred(decision: PendingDecision, preferred: string[]) {
  if (decision.kind === "yesNo") return true;
  const preferredOption = preferred.find((id) => decision.options.includes(id));
  if (preferredOption) return preferredOption;
  const [min] = decision.minMax ?? [1, 1];
  return min > 1 ? decision.options.slice(0, min) : (decision.options[0] ?? null);
}

function moveCardToDiscard(h: Harness, slug: string): string {
  const id = h.giveCard("p2", slug);
  h.state.hands.p2.splice(h.state.hands.p2.indexOf(id), 1);
  h.state.instances[id].zone = "discard";
  h.state.instances[id].ownerId = null;
  h.state.discard.push(id);
  return id;
}

async function returnToPlayerOne(h: Harness) {
  await h.endTurn("p1");
  await h.endTurn("p2");
}
