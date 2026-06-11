// Effect hooks for Downgrade cards (harmful cards attached to an opponent's Stable).
//
// Most downgrades are continuous auras read by derive.ts. Barbed Wire (per-event
// trigger) and Tiny Stable (state-based) are wired through the chokepoints / SBA
// via their aura tags; Sadistic Ritual has a beginning-of-turn trigger.

import type { CardDefinition } from "../../types";
import { isUnicorn } from "../../derive";

type Behavior = Partial<Pick<CardDefinition, "triggers" | "aura" | "canPlay">>;

export const DOWNGRADE_EFFECTS: Record<string, Behavior> = {
  "barbed-wire": { aura: "barbedWire" },
  "blinding-light": { aura: "blindingLight" },
  "broken-stable": { aura: "brokenStable" },
  "nanny-cam": { aura: "nannyCam" },
  pandamonium: { aura: "pandamonium" },
  slowdown: { aura: "slowdown" },
  "tiny-stable": { aura: "tinyStable" },

  "sadistic-ritual": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const myUnicorns = (ctx.state.stables[owner] ?? []).filter((id) =>
          isUnicorn(ctx.state, ctx.instance(id)),
        );
        if (myUnicorns.length === 0) {
          return;
        }
        // Mandatory: sacrifice a Unicorn, then draw a card.
        const pick = await ctx.chooseInstance(owner, myUnicorns, {
          prompt: "Sacrifice a Unicorn (Sadistic Ritual).",
        });
        if (pick) await ctx.sacrifice(pick);
        await ctx.draw(owner, 1);
      },
    },
  },
};
