// Effect hooks for Magical Unicorns.
//
// Each entry maps a card slug to the subset of CardDefinition behavior fields it
// needs. The registry in ../index.ts merges these onto the base CardData.

import type { CardDefinition, EffectContext, CardInstance } from "../../types";
import { isUnicorn } from "../../derive";

type Behavior = Partial<
  Pick<
    CardDefinition,
    | "triggers"
    | "aura"
    | "replacement"
    | "canPlay"
    | "grantsExtraPlays"
    | "grantsExtraDraws"
    | "unicornValue"
    | "cantBeDestroyedByMagic"
    | "cantBeSacrificedOrDestroyed"
  >
>;

// Helpers shared across unicorn effects ------------------------------------

/** All unicorn instanceIds in play that pass a filter, across every stable. */
function unicornsInPlay(
  ctx: EffectContext,
  filter: (c: CardInstance) => boolean = () => true,
): string[] {
  const out: string[] = [];
  for (const p of ctx.state.players) {
    for (const id of ctx.state.stables[p.id] ?? []) {
      const inst = ctx.state.instances[id];
      if (isUnicorn(ctx.state, inst) && filter(inst)) out.push(id);
    }
  }
  return out;
}

/** Targetable unicorns (respecting Pandamonium), optionally excluding owner/self. */
function targetableUnicorns(
  ctx: EffectContext,
  opts: { excludeOwner?: string; excludeInstance?: string } = {},
): string[] {
  return unicornsInPlay(ctx, (c) => {
    if (opts.excludeOwner && c.ownerId === opts.excludeOwner) return false;
    if (opts.excludeInstance && c.instanceId === opts.excludeInstance) return false;
    return true;
  }).filter((id) => ctx.isTargetable(id, "targeted"));
}

function upgradesInPlay(ctx: EffectContext): string[] {
  const out: string[] = [];
  for (const p of ctx.state.players) {
    for (const id of ctx.state.stables[p.id] ?? []) {
      if (ctx.def(id).cardClass === "upgrade") out.push(id);
    }
  }
  return out;
}

function discardFiltered(ctx: EffectContext, pred: (d: CardDefinition) => boolean): string[] {
  return ctx.state.discard.filter((id) => pred(ctx.def(id)));
}

/** Generic "may add a card from the discard pile to your hand" enter effect. */
function fetchFromDiscard(pred: (d: CardDefinition) => boolean, prompt: string): Behavior {
  return {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const opts = discardFiltered(ctx, pred);
        if (opts.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, opts, { may: true, prompt });
        if (pick) ctx.takeToHand(source.ownerId!, pick);
      },
    },
  };
}

// Effects -------------------------------------------------------------------

export const UNICORN_EFFECTS: Record<string, Behavior> = {
  // --- "return this to hand if it would die" flying unicorns ----------------
  "annoying-flying-unicorn": {
    replacement: ["returnToHand"],
    triggers: {
      onEnterStable: async (ctx, source) => {
        const others = ctx.state.players
          .filter((p) => p.id !== source.ownerId && (ctx.state.hands[p.id] ?? []).length > 0)
          .map((p) => p.id);
        if (others.length === 0) return;
        const target = await ctx.choosePlayer(source.ownerId!, others, {
          may: true,
          prompt: "Force a player to discard a card?",
        });
        if (target) await ctx.discardChoice(target, 1);
      },
    },
  },

  "greedy-flying-unicorn": {
    replacement: ["returnToHand"],
    triggers: {
      onEnterStable: async (ctx, source) => {
        await ctx.draw(source.ownerId!, 1);
      },
    },
  },

  "majestic-flying-unicorn": {
    replacement: ["returnToHand"],
    ...fetchFromDiscard(
      (d) => d.cardClass === "unicorn",
      "Add a Unicorn from the discard pile to your hand?",
    ),
  },

  "swift-flying-unicorn": {
    replacement: ["returnToHand"],
    ...fetchFromDiscard(
      (d) => d.id === "neigh" || d.id === "super-neigh",
      "Add a Neigh from the discard pile to your hand?",
    ),
  },

  // --- discard-pile / search fetchers --------------------------------------
  "magical-flying-unicorn": fetchFromDiscard(
    (d) => d.cardClass === "magic",
    "Add a Magic card from the discard pile to your hand?",
  ),

  "classy-narwhal": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        await ctx.searchDeck(source.ownerId!, (d) => d.cardClass === "upgrade", {
          may: true,
          prompt: "Search the deck for an Upgrade card.",
        });
      },
    },
  },

  "shabby-the-narwhal": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        await ctx.searchDeck(source.ownerId!, (d) => d.cardClass === "downgrade", {
          may: true,
          prompt: "Search the deck for a Downgrade card.",
        });
      },
    },
  },

  "the-great-narwhal": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        await ctx.searchDeck(source.ownerId!, (d) => /narwhal/i.test(d.name), {
          may: true,
          prompt: 'Search the deck for a card with "Narwhal" in its name.',
        });
      },
    },
  },

  // --- steal / take ---------------------------------------------------------
  "alluring-narwhal": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const opts = upgradesInPlay(ctx);
        if (opts.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, opts, {
          may: true,
          prompt: "Steal an Upgrade card?",
        });
        if (pick) await ctx.steal(pick, source.ownerId!);
      },
    },
  },

  americorn: {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const others = ctx.state.players
          .filter((p) => p.id !== source.ownerId && (ctx.state.hands[p.id] ?? []).length > 0)
          .map((p) => p.id);
        if (others.length === 0) return;
        const target = await ctx.choosePlayer(source.ownerId!, others, {
          may: true,
          prompt: "Take a card at random from a player's hand?",
        });
        if (!target) return;
        const hand = ctx.state.hands[target];
        const id = hand[ctx.randomInt(hand.length)];
        ctx.takeToHand(source.ownerId!, id);
        ctx.log(`took a card at random from ${ctx.playerName(target)}`);
      },
    },
  },

  "seductive-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const targets = targetableUnicorns(ctx, { excludeOwner: source.ownerId! });
        if (targets.length === 0) return;
        if ((ctx.state.hands[source.ownerId!] ?? []).length === 0) return;
        const confirm = await ctx.yesNo(source.ownerId!, "Discard a card to steal a Unicorn?");
        if (!confirm) return;
        await ctx.discardChoice(source.ownerId!, 1);
        const pick = await ctx.chooseInstance(source.ownerId!, targets, {
          prompt: "Steal which Unicorn?",
        });
        if (pick) await ctx.steal(pick, source.ownerId!);
      },
    },
  },

  // --- forced mass effects --------------------------------------------------
  "extremely-destructive-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        for (const pid of ctx.playersInTurnOrderFrom(source.ownerId!)) {
          const own = (ctx.state.stables[pid] ?? []).filter((id) =>
            isUnicorn(ctx.state, ctx.instance(id)),
          );
          if (own.length === 0) continue;
          const pick = await ctx.chooseInstance(pid, own, {
            prompt: "Sacrifice a Unicorn (Extremely Destructive Unicorn).",
          });
          if (pick) await ctx.sacrifice(pick);
        }
      },
    },
  },

  llamacorn: {
    triggers: {
      onEnterStable: async (ctx, source) => {
        for (const pid of ctx.playersInTurnOrderFrom(source.ownerId!)) {
          if ((ctx.state.hands[pid] ?? []).length === 0) continue;
          await ctx.discardChoice(pid, 1);
        }
      },
    },
  },

  // --- bring from nursery / hand -------------------------------------------
  "rainbow-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const basics = (ctx.state.hands[source.ownerId!] ?? []).filter(
          (id) => ctx.def(id).kind === "basic",
        );
        if (basics.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, basics, {
          may: true,
          prompt: "Bring a Basic Unicorn from your hand into your Stable?",
        });
        if (pick) await ctx.moveUnicornToStable(pick, source.ownerId!, { from: "hand" });
      },
    },
  },

  "mermaid-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const targets: string[] = [];
        for (const p of ctx.state.players) {
          if (p.id === source.ownerId) continue;
          for (const id of ctx.state.stables[p.id] ?? []) targets.push(id);
        }
        if (targets.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, targets, {
          prompt: "Return a card in another player's Stable to their hand.",
        });
        if (pick) await ctx.returnToHand(pick);
      },
    },
  },

  // --- self-affecting enter effects ----------------------------------------
  "unicorn-on-the-cob": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        await ctx.draw(source.ownerId!, 2);
        if ((ctx.state.hands[source.ownerId!] ?? []).length > 0) {
          await ctx.discardChoice(source.ownerId!, 1);
        }
      },
    },
  },

  "chainsaw-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const upgrades = upgradesInPlay(ctx);
        const myDowngrades = (ctx.state.stables[source.ownerId!] ?? []).filter(
          (id) => ctx.def(id).cardClass === "downgrade",
        );
        const choices: { key: string; label: string }[] = [];
        if (upgrades.length) choices.push({ key: "upgrade", label: "Destroy an Upgrade card" });
        if (myDowngrades.length)
          choices.push({ key: "downgrade", label: "Sacrifice a Downgrade in your Stable" });
        if (choices.length === 0) return;
        const choice = await ctx.chooseOption(source.ownerId!, choices, {
          may: true,
          prompt: "Chainsaw Unicorn:",
        });
        if (choice === "upgrade") {
          const pick = await ctx.chooseInstance(source.ownerId!, upgrades, {
            prompt: "Destroy which Upgrade?",
          });
          if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "unicorn" });
        } else if (choice === "downgrade") {
          const pick = await ctx.chooseInstance(source.ownerId!, myDowngrades, {
            prompt: "Sacrifice which Downgrade?",
          });
          if (pick) await ctx.sacrifice(pick);
        }
      },
    },
  },

  "narwhal-torpedo": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const downgrades = (ctx.state.stables[source.ownerId!] ?? []).filter(
          (id) => ctx.def(id).cardClass === "downgrade",
        );
        for (const id of downgrades) await ctx.sacrifice(id);
      },
    },
  },

  "shark-with-a-horn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!; // capture before sacrificing self
        const targets = targetableUnicorns(ctx, { excludeInstance: source.instanceId });
        if (targets.length === 0) return;
        const confirm = await ctx.yesNo(owner, "Sacrifice Shark With a Horn to destroy a Unicorn?");
        if (!confirm) return;
        await ctx.sacrifice(source.instanceId);
        const refreshed = targetableUnicorns(ctx, { excludeInstance: source.instanceId });
        const pick = await ctx.chooseInstance(owner, refreshed, {
          prompt: "Destroy which Unicorn?",
        });
        if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "unicorn" });
      },
    },
  },

  // --- beginning-of-turn unicorns ------------------------------------------
  "angel-unicorn": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!; // capture before sacrificing self
        const fromDiscard = discardFiltered(ctx, (d) => d.cardClass === "unicorn");
        if (fromDiscard.length === 0) return;
        const confirm = await ctx.yesNo(
          owner,
          "Sacrifice Angel Unicorn to bring a Unicorn from the discard pile into your Stable?",
        );
        if (!confirm) return;
        await ctx.sacrifice(source.instanceId);
        const refreshed = discardFiltered(ctx, (d) => d.cardClass === "unicorn");
        const pick = await ctx.chooseInstance(owner, refreshed, {
          prompt: "Bring which Unicorn into your Stable?",
        });
        if (pick) await ctx.moveUnicornToStable(pick, owner, { from: "discard" });
      },
    },
  },

  "extremely-fertile-unicorn": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        if ((ctx.state.hands[source.ownerId!] ?? []).length === 0) return;
        if (ctx.state.nursery.length === 0) return;
        const confirm = await ctx.yesNo(
          source.ownerId!,
          "Discard a card to bring a Baby Unicorn from the Nursery into your Stable?",
        );
        if (!confirm) return;
        await ctx.discardChoice(source.ownerId!, 1);
        const baby = ctx.state.nursery[ctx.state.nursery.length - 1];
        if (baby) await ctx.moveUnicornToStable(baby, source.ownerId!, { from: "nursery" });
      },
    },
  },

  rhinocorn: {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const targets = targetableUnicorns(ctx, { excludeInstance: source.instanceId });
        if (targets.length === 0) return;
        const confirm = await ctx.yesNo(
          source.ownerId!,
          "Destroy a Unicorn? (Rhinocorn — this immediately ends your turn.)",
        );
        if (!confirm) return;
        const pick = await ctx.chooseInstance(source.ownerId!, targets, {
          prompt: "Destroy which Unicorn?",
        });
        if (pick) {
          await ctx.destroy(pick, { selection: "targeted", bySource: "unicorn" });
          ctx.endTurnNow();
        }
      },
    },
  },

  "zombie-unicorn": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const myUnicorns = (ctx.state.stables[owner] ?? []).filter((id) =>
          isUnicorn(ctx.state, ctx.instance(id)),
        );
        const fromDiscard = discardFiltered(ctx, (d) => d.cardClass === "unicorn");
        if (myUnicorns.length === 0 || fromDiscard.length === 0) return;
        const confirm = await ctx.yesNo(
          owner,
          "Discard a Unicorn to bring one from the discard pile? (Immediately ends your turn.)",
        );
        if (!confirm) return;
        const sac = await ctx.chooseInstance(owner, myUnicorns, {
          prompt: "Discard which Unicorn from your Stable?",
        });
        if (!sac) return;
        await ctx.discardSpecific(sac);
        const refreshed = discardFiltered(ctx, (d) => d.cardClass === "unicorn");
        const pick = await ctx.chooseInstance(owner, refreshed, {
          prompt: "Bring which Unicorn into your Stable?",
        });
        if (pick) await ctx.moveUnicornToStable(pick, owner, { from: "discard" });
        ctx.endTurnNow();
      },
    },
  },

  // --- end-of-turn ----------------------------------------------------------
  puppicorn: {
    cantBeSacrificedOrDestroyed: true,
    triggers: {
      endOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const idx = ctx.state.players.findIndex((p) => p.id === owner);
        const leftId = ctx.state.players[(idx + 1) % ctx.state.players.length].id;
        if (leftId === owner) return;
        ctx.relocateCard(source.instanceId, leftId, "stable");
        ctx.log(`Puppicorn moved to ${ctx.playerName(leftId)}'s Stable`);
      },
    },
  },

  // --- on-death triggers ----------------------------------------------------
  "stabby-the-unicorn": {
    triggers: {
      onSacrificedOrDestroyed: async (ctx, source) => {
        const targets = targetableUnicorns(ctx);
        if (targets.length === 0) return;
        const chooser = source.ownerId ?? ctx.activePlayerId;
        const pick = await ctx.chooseInstance(chooser, targets, {
          may: true,
          prompt: "Stabby died — destroy a Unicorn?",
        });
        if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "unicorn" });
      },
    },
  },

  // --- static auras / replacement-only unicorns ----------------------------
  "ginormous-unicorn": { aura: "ginormous", unicornValue: 2 },
  "queen-bee-unicorn": { aura: "queenBee" },
  "magical-kittencorn": { cantBeDestroyedByMagic: true },
  "black-knight-unicorn": { replacement: ["blackKnight"] },
  "unicorn-phoenix": { replacement: ["phoenix"] },
};
