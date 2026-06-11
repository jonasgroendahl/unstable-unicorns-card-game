// Effect hooks for Magic cards (the `play` effect resolved when the card is played).

import type { CardDefinition, EffectContext, CardInstance } from "../../types";
import { isUnicorn } from "../../derive";

type Behavior = Partial<Pick<CardDefinition, "play" | "canPlay">>;

function allUnicorns(ctx: EffectContext, filter: (c: CardInstance) => boolean = () => true) {
  const out: string[] = [];
  for (const p of ctx.state.players) {
    for (const id of ctx.state.stables[p.id] ?? []) {
      const inst = ctx.state.instances[id];
      if (isUnicorn(ctx.state, inst) && filter(inst)) out.push(id);
    }
  }
  return out;
}

function targetableUnicorns(ctx: EffectContext) {
  return allUnicorns(ctx).filter((id) => ctx.isTargetable(id, "targeted"));
}

function allInStables(ctx: EffectContext, filter: (c: CardInstance) => boolean) {
  const out: string[] = [];
  for (const p of ctx.state.players) {
    for (const id of ctx.state.stables[p.id] ?? []) {
      if (filter(ctx.state.instances[id])) out.push(id);
    }
  }
  return out;
}

export const MAGIC_EFFECTS: Record<string, Behavior> = {
  "unicorn-poison": {
    canPlay: (ctx) => targetableUnicorns(ctx).length > 0,
    play: async (ctx) => {
      const targets = targetableUnicorns(ctx);
      const pick = await ctx.chooseInstance(ctx.activePlayerId, targets, {
        prompt: "Destroy which Unicorn?",
      });
      if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "magic" });
    },
  },

  "targeted-destruction": {
    canPlay: (ctx) =>
      allInStables(ctx, (c) => ctx.def(c.instanceId).cardClass === "upgrade").length > 0 ||
      allInStables(ctx, (c) => ctx.def(c.instanceId).cardClass === "downgrade").length > 0,
    play: async (ctx) => {
      const upgrades = allInStables(ctx, (c) => ctx.def(c.instanceId).cardClass === "upgrade");
      const downgrades = allInStables(ctx, (c) => ctx.def(c.instanceId).cardClass === "downgrade");
      const choices: { key: string; label: string }[] = [];
      if (upgrades.length) choices.push({ key: "upgrade", label: "Destroy an Upgrade card" });
      if (downgrades.length)
        choices.push({ key: "downgrade", label: "Sacrifice a Downgrade card" });
      const choice = await ctx.chooseOption(ctx.activePlayerId, choices, {
        prompt: "Targeted Destruction:",
      });
      if (choice === "upgrade") {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, upgrades, {
          prompt: "Destroy which Upgrade?",
        });
        if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "magic" });
      } else if (choice === "downgrade") {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, downgrades, {
          prompt: "Sacrifice which Downgrade?",
        });
        if (pick) await ctx.sacrifice(pick);
      }
    },
  },

  "two-for-one": {
    canPlay: (ctx) =>
      // Need a card to sacrifice and at least one card to destroy.
      allInStables(ctx, () => true).length > 0,
    play: async (ctx) => {
      // SACRIFICE a card (one of your own stable cards), then DESTROY 2 cards.
      const mine = ctx.state.stables[ctx.activePlayerId] ?? [];
      if (mine.length > 0) {
        const sac = await ctx.chooseInstance(ctx.activePlayerId, mine.slice(), {
          prompt: "Sacrifice a card from your Stable.",
        });
        if (sac) await ctx.sacrifice(sac);
      }
      for (let i = 0; i < 2; i++) {
        const targets = allInStables(ctx, () => true).filter((id) =>
          ctx.isTargetable(id, "targeted"),
        );
        if (targets.length === 0) break;
        const pick = await ctx.chooseInstance(ctx.activePlayerId, targets, {
          prompt: `Destroy a card (${i + 1} of 2).`,
          may: true,
        });
        if (!pick) break;
        await ctx.destroy(pick, { selection: "targeted", bySource: "magic" });
      }
    },
  },

  "back-kick": {
    canPlay: (ctx) =>
      ctx.state.players.some(
        (p) => p.id !== ctx.activePlayerId && (ctx.state.stables[p.id] ?? []).length > 0,
      ),
    play: async (ctx) => {
      const targets: string[] = [];
      for (const p of ctx.state.players) {
        if (p.id === ctx.activePlayerId) continue;
        for (const id of ctx.state.stables[p.id] ?? []) targets.push(id);
      }
      const pick = await ctx.chooseInstance(ctx.activePlayerId, targets, {
        prompt: "Return a card in another player's Stable to their hand.",
      });
      if (!pick) return;
      const owner = ctx.instance(pick).ownerId!;
      await ctx.returnToHand(pick);
      if ((ctx.state.hands[owner] ?? []).length > 0) await ctx.discardChoice(owner, 1);
    },
  },

  "blatant-thievery": {
    canPlay: (ctx) =>
      ctx.state.players.some(
        (p) => p.id !== ctx.activePlayerId && (ctx.state.hands[p.id] ?? []).length > 0,
      ),
    play: async (ctx) => {
      const others = ctx.state.players
        .filter((p) => p.id !== ctx.activePlayerId && (ctx.state.hands[p.id] ?? []).length > 0)
        .map((p) => p.id);
      const target = await ctx.choosePlayer(ctx.activePlayerId, others, {
        prompt: "Look at which player's hand?",
      });
      if (!target) return;
      const pick = await ctx.chooseInstance(ctx.activePlayerId, ctx.state.hands[target].slice(), {
        prompt: `Choose a card from ${ctx.playerName(target)}'s hand.`,
      });
      if (pick) ctx.takeToHand(ctx.activePlayerId, pick);
    },
  },

  "change-of-luck": {
    play: async (ctx) => {
      await ctx.draw(ctx.activePlayerId, 2);
      const toDiscard = Math.min(3, (ctx.state.hands[ctx.activePlayerId] ?? []).length);
      if (toDiscard > 0) await ctx.discardChoice(ctx.activePlayerId, toDiscard);
      ctx.grantExtraTurn(ctx.activePlayerId);
      ctx.log("takes another turn (Change of Luck)");
    },
  },

  "glitter-tornado": {
    play: async (ctx) => {
      // Return a card in each player's stable (incl. yours) to their hand.
      for (const pid of ctx.playersInTurnOrderFrom(ctx.activePlayerId)) {
        const stable = (ctx.state.stables[pid] ?? []).slice();
        if (stable.length === 0) continue;
        const pick = await ctx.chooseInstance(pid, stable, {
          prompt: "Return one of your Stable cards to your hand (Glitter Tornado).",
        });
        if (pick) await ctx.returnToHand(pick);
      }
    },
  },

  "good-deal": {
    play: async (ctx) => {
      await ctx.draw(ctx.activePlayerId, 3);
      if ((ctx.state.hands[ctx.activePlayerId] ?? []).length > 0) {
        await ctx.discardChoice(ctx.activePlayerId, 1);
      }
    },
  },

  "mystical-vortex": {
    play: async (ctx) => {
      for (const pid of ctx.playersInTurnOrderFrom(ctx.activePlayerId)) {
        if ((ctx.state.hands[pid] ?? []).length === 0) continue;
        await ctx.discardChoice(pid, 1);
      }
      ctx.shuffleDiscardIntoDeck();
      ctx.log("shuffled the discard pile into the deck");
    },
  },

  "reset-button": {
    play: async (ctx) => {
      for (const pid of ctx.playersInTurnOrderFrom(ctx.activePlayerId)) {
        const cards = (ctx.state.stables[pid] ?? []).filter((id) => {
          const cls = ctx.def(id).cardClass;
          return cls === "upgrade" || cls === "downgrade";
        });
        for (const id of cards.slice()) await ctx.sacrifice(id);
      }
      ctx.shuffleDiscardIntoDeck();
      ctx.log("shuffled the discard pile into the deck");
    },
  },

  "re-target": {
    canPlay: (ctx) =>
      allInStables(ctx, (c) => {
        const cls = ctx.def(c.instanceId).cardClass;
        return cls === "upgrade" || cls === "downgrade";
      }).length > 0,
    play: async (ctx) => {
      const movable = allInStables(ctx, (c) => {
        const cls = ctx.def(c.instanceId).cardClass;
        return cls === "upgrade" || cls === "downgrade";
      });
      const pick = await ctx.chooseInstance(ctx.activePlayerId, movable, {
        prompt: "Move which Upgrade/Downgrade?",
      });
      if (!pick) return;
      const dest = await ctx.choosePlayer(
        ctx.activePlayerId,
        ctx.state.players.map((p) => p.id),
        { prompt: "Move it to which player's Stable?" },
      );
      if (dest) {
        ctx.relocateCard(pick, dest, "stable");
        ctx.log(`moved ${ctx.def(pick).name} to ${ctx.playerName(dest)}'s Stable`);
      }
    },
  },

  "shake-up": {
    play: async (ctx, source) => {
      // Shuffle this card, your hand, and the discard pile into the deck. Draw 5.
      const me = ctx.activePlayerId;
      const hand = (ctx.state.hands[me] ?? []).slice();
      for (const id of hand) ctx.relocateCard(id, null, "deck");
      for (const id of ctx.state.discard.slice()) ctx.relocateCard(id, null, "deck");
      ctx.relocateCard(source.instanceId, null, "deck"); // Shake Up itself
      ctx.shuffleDeck();
      await ctx.draw(me, 5);
    },
  },

  "unfair-bargain": {
    canPlay: (ctx) => ctx.state.players.some((p) => p.id !== ctx.activePlayerId),
    play: async (ctx) => {
      const others = ctx.state.players.filter((p) => p.id !== ctx.activePlayerId).map((p) => p.id);
      const target = await ctx.choosePlayer(ctx.activePlayerId, others, {
        prompt: "Trade hands with which player?",
      });
      if (!target) return;
      const me = ctx.activePlayerId;
      const myHand = ctx.state.hands[me];
      const theirHand = ctx.state.hands[target];
      ctx.state.hands[me] = theirHand;
      ctx.state.hands[target] = myHand;
      for (const id of ctx.state.hands[me]) ctx.instance(id).ownerId = me;
      for (const id of ctx.state.hands[target]) ctx.instance(id).ownerId = target;
      ctx.log(`traded hands with ${ctx.playerName(target)}`);
    },
  },

  "unicorn-shrinkray": {
    canPlay: (ctx) =>
      ctx.state.players.some((p) =>
        (ctx.state.stables[p.id] ?? []).some((id) => isUnicorn(ctx.state, ctx.instance(id))),
      ),
    play: async (ctx) => {
      const target = await ctx.choosePlayer(
        ctx.activePlayerId,
        ctx.state.players
          .filter((p) =>
            (ctx.state.stables[p.id] ?? []).some((id) => isUnicorn(ctx.state, ctx.instance(id))),
          )
          .map((p) => p.id),
        { prompt: "Replace all Unicorns in whose Stable with Baby Unicorns?" },
      );
      if (!target) return;
      const unicorns = (ctx.state.stables[target] ?? []).filter((id) =>
        isUnicorn(ctx.state, ctx.instance(id)),
      );
      for (const id of unicorns.slice()) {
        // Each replaced unicorn -> discard (Baby Unicorns go to Nursery instead, handled by leave).
        const isBaby = ctx.def(id).kind === "baby";
        ctx.relocateCard(id, null, isBaby ? "nursery" : "discard");
        if (ctx.state.nursery.length > 0) {
          const baby = ctx.state.nursery[ctx.state.nursery.length - 1];
          await ctx.moveUnicornToStable(baby, target, { from: "nursery" });
        }
      }
      ctx.log(`shrank ${ctx.playerName(target)}'s Unicorns into Baby Unicorns`);
    },
  },

  "unicorn-swap": {
    canPlay: (ctx) => {
      const mine = (ctx.state.stables[ctx.activePlayerId] ?? []).some((id) =>
        isUnicorn(ctx.state, ctx.instance(id)),
      );
      const theirs = ctx.state.players.some(
        (p) =>
          p.id !== ctx.activePlayerId &&
          (ctx.state.stables[p.id] ?? []).some((id) => isUnicorn(ctx.state, ctx.instance(id))),
      );
      return mine && theirs;
    },
    play: async (ctx) => {
      const me = ctx.activePlayerId;
      const myUnicorns = (ctx.state.stables[me] ?? []).filter((id) =>
        isUnicorn(ctx.state, ctx.instance(id)),
      );
      const give = await ctx.chooseInstance(me, myUnicorns, {
        prompt: "Give which of your Unicorns?",
      });
      if (!give) return;
      const theirUnicorns = allUnicorns(ctx, (c) => c.ownerId !== me).filter((id) =>
        ctx.isTargetable(id, "targeted"),
      );
      const take = await ctx.chooseInstance(me, theirUnicorns, {
        prompt: "Take which Unicorn?",
      });
      if (!take) return;
      const otherOwner = ctx.instance(take).ownerId!;
      // Swap: give -> otherOwner's stable, take -> my stable.
      ctx.relocateCard(give, otherOwner, "stable");
      ctx.relocateCard(take, me, "stable");
      ctx.log(`swapped ${ctx.def(give).name} for ${ctx.def(take).name}`);
    },
  },
};
