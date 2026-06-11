import { describe, expect, it } from "vitest";
import { Harness } from "./testHarness";
import { getDefinition } from "../cards";
import { sanitizeFor } from "../view";
import type { PendingDecision } from "../types";

describe("setup", () => {
  it("deals 5-card hands, a baby per stable, and starts on turn 1", async () => {
    const h = new Harness();
    expect(h.state.players.length).toBe(2);
    // After start(), the active player has drawn 1 (6 cards); opponent has 5.
    await h.start();
    expect(h.state.hands.p1.length).toBe(6);
    expect(h.state.hands.p2.length).toBe(5);
    expect(h.state.stables.p1.length).toBe(1);
    expect(getDefinition(h.state.instances[h.state.stables.p1[0]].defId).kind).toBe("baby");
    expect(h.state.phase).toBe("action");
    expect(h.engine.currentPlayerId()).toBeTruthy();
    expect(h.state.lastAutoDrawn?.instanceId).toBe(h.state.hands.p1.at(-1));
    expect(sanitizeFor(h.state, "p1").autoDrawnCardId).toBe(h.state.lastAutoDrawn?.instanceId);
    expect(sanitizeFor(h.state, "p2").autoDrawnCardId).toBeNull();
  });
});

describe("playing a basic unicorn", () => {
  it("moves the unicorn into the stable and ends the turn", async () => {
    const h = new Harness();
    await h.start();
    const basic = h.giveCard("p1", "basic-unicorn-red");
    await h.play("p1", basic);
    expect(h.stableSlugs("p1")).toContain("basic-unicorn-red");
    // Turn passed to p2 (single play used).
    expect(h.engine.currentPlayerId()).toBe("p2");
  });
});

describe("Unicorn Poison destroys a unicorn", () => {
  it("sends the chosen unicorn to the discard pile", async () => {
    const h = new Harness();
    await h.start();
    // Give p2 a target unicorn.
    const victim = h.giveStable("p2", "rainbow-unicorn");
    const poison = h.giveCard("p1", "unicorn-poison");
    // Decide: target the rainbow unicorn (not p1's baby).
    h.setDecide((d: PendingDecision) => {
      if (d.kind === "chooseInstance") return victim;
      return d.options[0] ?? true;
    });
    await h.play("p1", poison);
    expect(h.state.instances[victim].zone).toBe("discard");
  });
});

describe("Neigh cancels a played card", () => {
  it("an odd number of Neighs cancels the original", async () => {
    const h = new Harness();
    await h.start();
    const basic = h.giveCard("p1", "basic-unicorn-blue");
    const neigh = h.giveCard("p2", "neigh");
    h.setReact((pid) => (pid === "p2" ? neigh : null));
    await h.play("p1", basic);
    // Basic was Neigh'd → it's in discard, not p1's stable.
    expect(h.state.instances[basic].zone).toBe("discard");
    expect(h.state.instances[neigh].zone).toBe("discard");
    expect(h.stableSlugs("p1")).not.toContain("basic-unicorn-blue");
  });

  it("two Neighs (Neigh the Neigh) let the original resolve", async () => {
    const h = new Harness();
    await h.start();
    const basic = h.giveCard("p1", "basic-unicorn-green");
    const neigh2 = h.giveCard("p2", "neigh");
    const neigh1 = h.giveCard("p1", "neigh");
    let count = 0;
    h.setReact((pid) => {
      count++;
      if (pid === "p2" && count === 1) return neigh2; // p2 neighs the basic
      if (pid === "p1") return neigh1; // p1 neighs p2's neigh
      return null;
    });
    await h.play("p1", basic);
    expect(h.stableSlugs("p1")).toContain("basic-unicorn-green");
  });
});

describe("Super Neigh cannot be Neigh'd", () => {
  it("ends the chain and cancels the original", async () => {
    const h = new Harness();
    await h.start();
    const basic = h.giveCard("p1", "basic-unicorn-yellow");
    const superNeigh = h.giveCard("p2", "super-neigh");
    const counter = h.giveCard("p1", "neigh");
    h.setReact((pid) => {
      if (pid === "p2") return superNeigh;
      if (pid === "p1") return counter; // should never be allowed to respond
      return null;
    });
    await h.play("p1", basic);
    expect(h.state.instances[basic].zone).toBe("discard");
    // p1 never got to play their Neigh.
    expect(h.state.instances[counter].zone).toBe("hand");
  });
});

describe("Stabby on-death trigger", () => {
  it("destroys another unicorn when Stabby is destroyed", async () => {
    const h = new Harness();
    await h.start();
    const stabby = h.giveStable("p2", "stabby-the-unicorn");
    const collateral = h.giveStable("p2", "rainbow-unicorn");
    const poison = h.giveCard("p1", "unicorn-poison");
    h.setDecide((d) => {
      // First decision: poison picks Stabby. Second decision (Stabby's revenge):
      // Stabby is gone, so pick whatever target remains (the collateral unicorn).
      if (d.kind === "chooseInstance") {
        if (d.options.includes(stabby)) return stabby;
        if (d.options.includes(collateral)) return collateral;
        return d.options[0];
      }
      return true;
    });
    await h.play("p1", poison);
    expect(h.state.instances[stabby].zone).toBe("discard");
    expect(h.state.instances[collateral].zone).toBe("discard");
  });
});

describe("Rainbow Aura prevents destruction", () => {
  it("a protected unicorn cannot be destroyed", async () => {
    const h = new Harness();
    await h.start();
    const protectedUni = h.giveStable("p2", "rainbow-unicorn");
    h.giveStable("p2", "rainbow-aura");
    const poison = h.giveCard("p1", "unicorn-poison");
    h.setDecide((d) => (d.kind === "chooseInstance" ? protectedUni : (d.options[0] ?? true)));
    await h.play("p1", poison);
    expect(h.state.instances[protectedUni].zone).toBe("stable");
  });
});

describe("win condition", () => {
  it("declares a winner at 7 unicorns (2 players)", async () => {
    const h = new Harness();
    await h.start();
    // Stack p1's stable to 6, then play a 7th.
    for (const slug of [
      "basic-unicorn-red",
      "basic-unicorn-orange",
      "basic-unicorn-yellow",
      "basic-unicorn-green",
      "basic-unicorn-blue",
    ]) {
      h.giveStable("p1", slug);
    }
    // p1 stable now: baby + 5 = 6 unicorns. Play one more.
    const seventh = h.giveCard("p1", "basic-unicorn-indigo");
    await h.play("p1", seventh);
    expect(h.state.status).toBe("finished");
    expect(h.state.winnerId).toBe("p1");
  });
});
