// Effect hooks for Upgrade cards (beneficial cards attached to a Stable).

import type { CardDefinition } from "../../types";
import { hasBasicUnicornInStable, isUnicorn } from "../../derive";

type Behavior = Partial<Pick<CardDefinition, "triggers" | "aura" | "canPlay" | "grantsExtraPlays">>;

export const UPGRADE_EFFECTS: Record<string, Behavior> = {
  // Action-economy upgrades. The extra play/draw is applied at beginning of turn
  // by the turn driver via grantsExtraPlays/Draws; the trigger logs the grant.
  "double-dutch": {
    grantsExtraPlays: 1,
  },

  "extra-tail": {
    // Must have a Basic Unicorn in your stable to play.
    canPlay: (ctx) => hasBasicUnicornInStable(ctx.state, ctx.activePlayerId),
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const draw = await ctx.yesNo(source.ownerId!, "Draw an extra card? (Extra Tail)");
        if (draw) await ctx.draw(source.ownerId!, 1);
      },
    },
  },

  "rainbow-mane": {
    canPlay: (ctx) => hasBasicUnicornInStable(ctx.state, ctx.activePlayerId),
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const basics = (ctx.state.hands[source.ownerId!] ?? []).filter(
          (id) => ctx.def(id).kind === "basic",
        );
        if (basics.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, basics, {
          may: true,
          prompt: "Bring a Basic Unicorn from your hand into your Stable? (Rainbow Mane)",
        });
        if (pick) await ctx.moveUnicornToStable(pick, source.ownerId!, { from: "hand" });
      },
    },
  },

  "glitter-bomb": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        // SACRIFICE a card, then DESTROY a card.
        const mine = (ctx.state.stables[source.ownerId!] ?? []).slice();
        if (mine.length === 0) return;
        const confirm = await ctx.yesNo(
          source.ownerId!,
          "Glitter Bomb: sacrifice a card to destroy a card?",
        );
        if (!confirm) return;
        const sac = await ctx.chooseInstance(source.ownerId!, mine, {
          prompt: "Sacrifice which card?",
        });
        if (sac) await ctx.sacrifice(sac);
        const targets: string[] = [];
        for (const p of ctx.state.players) {
          for (const id of ctx.state.stables[p.id] ?? []) {
            if (ctx.isTargetable(id, "targeted")) targets.push(id);
          }
        }
        if (targets.length === 0) return;
        const pick = await ctx.chooseInstance(source.ownerId!, targets, {
          prompt: "Destroy which card?",
        });
        if (pick) await ctx.destroy(pick, { selection: "targeted", bySource: "upgrade" });
      },
    },
  },

  "summoning-ritual": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const myUnicorns = (ctx.state.stables[source.ownerId!] ?? []).filter((id) =>
          isUnicorn(ctx.state, ctx.instance(id)),
        );
        const fromDiscard = ctx.state.discard.filter((id) => ctx.def(id).cardClass === "unicorn");
        if (myUnicorns.length < 2 || fromDiscard.length === 0) return;
        const confirm = await ctx.yesNo(
          source.ownerId!,
          "Summoning Ritual: discard 2 Unicorns to bring one from the discard pile?",
        );
        if (!confirm) return;
        const picks = await ctx.chooseInstances(source.ownerId!, myUnicorns, {
          prompt: "Discard which 2 Unicorns?",
          minMax: [2, 2],
        });
        for (const id of picks) await ctx.discardSpecific(id);
        const refreshed = ctx.state.discard.filter((id) => ctx.def(id).cardClass === "unicorn");
        const bring = await ctx.chooseInstance(source.ownerId!, refreshed, {
          prompt: "Bring which Unicorn into your Stable?",
        });
        if (bring) await ctx.moveUnicornToStable(bring, source.ownerId!, { from: "discard" });
      },
    },
  },

  "unicorn-lasso": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const targets: string[] = [];
        for (const p of ctx.state.players) {
          if (p.id === owner) continue;
          for (const id of ctx.state.stables[p.id] ?? []) {
            if (isUnicorn(ctx.state, ctx.instance(id)) && ctx.isTargetable(id, "targeted")) {
              targets.push(id);
            }
          }
        }
        if (targets.length === 0) return;
        const pick = await ctx.chooseInstance(owner, targets, {
          may: true,
          prompt: "Borrow a Unicorn into your Stable until end of turn? (Unicorn Lasso)",
        });
        if (!pick) return;
        const inst = ctx.instance(pick);
        const original = inst.ownerId!;
        inst.borrowed = { byPlayer: owner, originalOwner: original, returnAtTurnOf: owner };
        ctx.relocateCard(pick, owner, "stable");
        ctx.log(`borrowed ${ctx.def(pick).name} from ${ctx.playerName(original)}`);
      },
      endOfTurn: async (ctx, source) => {
        // Return any unicorns this player borrowed via Lasso.
        const owner = source.ownerId!;
        for (const id of (ctx.state.stables[owner] ?? []).slice()) {
          const inst = ctx.instance(id);
          if (inst.borrowed && inst.borrowed.byPlayer === owner) {
            const back = inst.borrowed.originalOwner;
            inst.borrowed = undefined;
            ctx.relocateCard(id, back, "stable");
            ctx.log(`returned ${ctx.def(id).name} to ${ctx.playerName(back)}`);
          }
        }
      },
    },
  },

  "rainbow-aura": { aura: "rainbowAura" },
  yay: { aura: "yay" },
};
