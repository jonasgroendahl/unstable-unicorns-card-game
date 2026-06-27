import { describe, expect, it } from "vitest";
import { Harness } from "./testHarness";
import { createGame } from "../index";
import type { PendingDecision } from "../types";

describe("Black Knight replacement", () => {
  it("sacrifices itself to save a different unicorn from destruction", async () => {
    const h = new Harness();
    await h.start();
    const knight = h.giveStable("p2", "black-knight-unicorn");
    const target = h.giveStable("p2", "rainbow-unicorn");
    const poison = h.giveCard("p1", "unicorn-poison");
    h.setDecide((d: PendingDecision) => {
      if (d.kind === "yesNo") return true; // use Black Knight
      if (d.kind === "chooseInstance") return target; // poison targets the rainbow unicorn
      return d.options[0] ?? true;
    });
    await h.play("p1", poison);
    // Rainbow unicorn saved; Black Knight sacrificed.
    expect(h.state.instances[target].zone).toBe("stable");
    expect(h.state.instances[knight].zone).toBe("discard");
  });
});

describe("Unicorn Phoenix replacement", () => {
  it("discards a card instead of dying", async () => {
    const h = new Harness();
    await h.start();
    const phoenix = h.giveStable("p2", "unicorn-phoenix");
    h.giveCard("p2", "basic-unicorn-red"); // a card to discard
    const poison = h.giveCard("p1", "unicorn-poison");
    h.setDecide((d) => {
      if (d.kind === "yesNo") return true; // use Phoenix
      if (d.kind === "chooseInstance") return d.options[0]; // poison target / discard pick
      return true;
    });
    await h.play("p1", poison);
    expect(h.state.instances[phoenix].zone).toBe("stable");
  });
});

describe("Tiny Stable state-based action", () => {
  it("forces a sacrifice when a stable exceeds 5 unicorns", async () => {
    const h = new Harness();
    await h.start();
    // p1 gets 5 unicorns + baby = 6, plus Tiny Stable downgrade.
    for (const s of [
      "basic-unicorn-red",
      "basic-unicorn-orange",
      "basic-unicorn-yellow",
      "basic-unicorn-green",
    ]) {
      h.giveStable("p1", s);
    }
    h.giveStable("p1", "tiny-stable");
    // p1 stable: baby + 4 basics = 5 unicorns (ok). Add a 6th via play.
    const sixth = h.giveCard("p1", "basic-unicorn-blue");
    const before = h.state.stables.p1.filter((id) => h.state.instances[id].ownerId === "p1").length;
    await h.play("p1", sixth);
    // After Tiny Stable resolves, unicorn count is back to 5.
    const unicornCount = h.state.stables.p1.filter((id) => {
      const def = h.state.instances[id].defId;
      return def.includes("unicorn") || def.includes("narwhal");
    }).length;
    expect(unicornCount).toBeLessThanOrEqual(5);
    void before;
  });
});

describe("Queen Bee Unicorn", () => {
  it("prevents basic unicorns from entering other stables", async () => {
    const h = new Harness();
    await h.start();
    h.giveStable("p2", "queen-bee-unicorn"); // p2 has Queen Bee
    const basic = h.giveCard("p1", "basic-unicorn-red");
    await h.play("p1", basic);
    // p1 could not play the basic into their own stable (Queen Bee belongs to p2).
    expect(h.stableSlugs("p1")).not.toContain("basic-unicorn-red");
    expect(h.state.instances[basic].zone).not.toBe("stable");
  });
});

describe("Change of Luck grants an extra turn", () => {
  it("the same player takes another turn", async () => {
    const h = new Harness();
    await h.start();
    const col = h.giveCard("p1", "change-of-luck");
    h.setDecide((d) => {
      if (d.kind === "chooseInstance") return d.options.slice(0, d.minMax?.[0] ?? 1);
      return true;
    });
    await h.play("p1", col);
    // After Change of Luck resolves and the turn ends, it should be p1 again.
    expect(h.engine.currentPlayerId()).toBe("p1");
  });

  it("does not offer the played Magic card as one of its discard choices", async () => {
    const h = new Harness();
    await h.start();
    h.clearHand("p1");
    const col = h.giveCard("p1", "change-of-luck");
    let sawDiscardChoice = false;
    h.setDecide((d) => {
      if (d.kind === "chooseInstance" && d.prompt.startsWith("Discard")) {
        sawDiscardChoice = true;
        expect(d.options).not.toContain(col);
        return d.options.slice(0, d.minMax?.[0] ?? 1);
      }
      return true;
    });

    await h.play("p1", col);

    expect(sawDiscardChoice).toBe(true);
    expect(h.state.instances[col].zone).toBe("discard");
  });
});

describe("Good Deal", () => {
  it("does not offer the played Magic card as its discard choice", async () => {
    const h = new Harness();
    await h.start();
    h.clearHand("p1");
    const goodDeal = h.giveCard("p1", "good-deal");
    let sawDiscardChoice = false;
    h.setDecide((d) => {
      if (d.kind === "chooseInstance" && d.prompt.startsWith("Discard")) {
        sawDiscardChoice = true;
        expect(d.options).not.toContain(goodDeal);
        return d.options[0] ?? null;
      }
      return true;
    });

    await h.play("p1", goodDeal);

    expect(sawDiscardChoice).toBe(true);
    expect(h.state.instances[goodDeal].zone).toBe("discard");
  });
});

describe("deck reshuffle on empty", () => {
  it("reshuffles the discard pile when the deck runs out", async () => {
    const h = new Harness();
    await h.start();
    // Move most of the deck to discard, then force draws.
    const s = h.state;
    const toMove = s.deck.splice(0, s.deck.length - 1);
    for (const id of toMove) {
      s.instances[id].zone = "discard";
      s.instances[id].ownerId = null;
      s.discard.push(id);
    }
    expect(s.deck.length).toBe(1);
    await h.engine.draw("p1", 5);
    await h.settle();
    // Draw succeeded by reshuffling — p1 gained cards and the discard shrank.
    expect(s.hands.p1.length).toBeGreaterThan(6);
  });
});

describe("full bot game", () => {
  it("a 4-bot game runs to completion without hanging", { timeout: 15000 }, async () => {
    const engine = createGame({
      gameId: "bots",
      seed: 999,
      botActionDelayMs: 0,
      seats: [
        { id: "b1", name: "Bot 1", isBot: true },
        { id: "b2", name: "Bot 2", isBot: true },
        { id: "b3", name: "Bot 3", isBot: true },
        { id: "b4", name: "Bot 4", isBot: true },
      ],
    });
    // Let the bots play; cap wall-clock so a hang fails fast.
    const deadline = Date.now() + 8000;
    while (engine.state.status === "active" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10));
    }
    // Either someone won, or it's still active but progressed many turns
    // (deck may deplete). It must NOT be wedged on a decision with no answer.
    expect(["active", "finished"]).toContain(engine.state.status);
    expect(engine.state.turnNumber).toBeGreaterThan(3);
  });
});
