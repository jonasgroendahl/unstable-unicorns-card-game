import { isUnicorn } from "../../derive";
import type { CardDefinition, CardInstance, EffectContext } from "../../types";

type Behavior = Partial<Pick<CardDefinition, "triggers" | "play" | "aura" | "canPlay">>;

function cardsInPlay(ctx: EffectContext, predicate: (card: CardInstance) => boolean): string[] {
  const cards: string[] = [];
  for (const player of ctx.state.players) {
    for (const id of ctx.state.stables[player.id] ?? []) {
      const card = ctx.instance(id);
      if (predicate(card)) cards.push(id);
    }
  }
  return cards;
}

function targetableUnicorns(ctx: EffectContext, exceptOwner?: string): string[] {
  return cardsInPlay(
    ctx,
    (card) =>
      isUnicorn(ctx.state, card) &&
      card.ownerId !== exceptOwner &&
      ctx.isTargetable(card.instanceId, "targeted"),
  );
}

function cardsInDiscard(
  ctx: EffectContext,
  predicate: (definition: CardDefinition) => boolean,
): string[] {
  return ctx.state.discard.filter((id) => predicate(ctx.def(id)));
}

function otherPlayersWithCards(ctx: EffectContext, owner: string): string[] {
  return ctx.state.players
    .filter((player) => player.id !== owner && (ctx.state.hands[player.id] ?? []).length > 0)
    .map((player) => player.id);
}

async function bringCardIntoStable(
  ctx: EffectContext,
  instanceId: string,
  ownerId: string,
): Promise<void> {
  if (isUnicorn(ctx.state, ctx.instance(instanceId))) {
    await ctx.moveUnicornToStable(instanceId, ownerId, {
      from: ctx.instance(instanceId).zone,
    });
  } else {
    ctx.attachToStable(instanceId, ownerId);
  }
}

export const ADVENTURES_EFFECTS: Record<string, Behavior> = {
  "bungee-jumping-unicorn": {
    triggers: {
      onSacrificedOrDestroyed: async (ctx, source) => {
        const owner = source.ownerId!;
        const downgrades = (ctx.state.stables[owner] ?? []).filter(
          (id) => ctx.def(id).cardClass === "downgrade",
        );
        const options = [{ key: "return", label: "Return this card to your hand" }];
        if (downgrades.length > 0) {
          options.unshift({ key: "sacrifice", label: "Sacrifice a Downgrade card" });
        }
        const choice = await ctx.chooseOption(owner, options, {
          may: true,
          prompt: "Bungee Jumping Unicorn:",
        });
        if (choice === "return") {
          ctx.takeToHand(owner, source.instanceId);
        } else if (choice === "sacrifice") {
          const pick = await ctx.chooseInstance(owner, downgrades, {
            prompt: "Sacrifice which Downgrade?",
          });
          if (pick) await ctx.sacrifice(pick);
        }
      },
    },
  },
  "cutthroat-captain-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        const babies = targetableUnicorns(ctx, owner).filter((id) => ctx.def(id).kind === "baby");
        const basics = cardsInDiscard(ctx, (definition) => definition.kind === "basic");
        const options = [];
        if (babies.length > 0) options.push({ key: "steal", label: "Steal a Baby Unicorn" });
        if (basics.length > 0) {
          options.push({
            key: "bring",
            label: "Bring a Basic Unicorn from the discard pile into your Stable",
          });
        }
        const choice = await ctx.chooseOption(owner, options, {
          may: true,
          prompt: "Cutthroat Captain Unicorn:",
        });
        if (choice === "steal") {
          const pick = await ctx.chooseInstance(owner, babies, {
            prompt: "Steal which Baby Unicorn?",
          });
          if (pick) await ctx.steal(pick, owner);
        } else if (choice === "bring") {
          const pick = await ctx.chooseInstance(owner, basics, {
            prompt: "Bring which Basic Unicorn into your Stable?",
          });
          if (pick) await ctx.moveUnicornToStable(pick, owner, { from: "discard" });
        }
      },
    },
  },
  "extreme-adventurer-unicorn": {
    aura: "extremeAdventurer",
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        if (await ctx.yesNo(source.ownerId!, "Extreme Adventurer Unicorn: draw a card?")) {
          await ctx.draw(source.ownerId!, 1);
        }
      },
    },
  },
  "fearless-unicorn": {
    triggers: {
      onSacrificedOrDestroyed: async (ctx, source) => {
        const instants = cardsInDiscard(ctx, (definition) => definition.cardClass === "instant");
        const pick = await ctx.chooseInstance(source.ownerId!, instants, {
          may: true,
          prompt: "Add an Instant card from the discard pile to your hand?",
        });
        if (pick) ctx.takeToHand(source.ownerId!, pick);
      },
    },
  },
  "first-mer-mate-unicorn": {
    triggers: {
      onSacrificedOrDestroyed: async (ctx, source) => {
        const owner = source.ownerId!;
        const basics = (ctx.state.hands[owner] ?? []).filter((id) => ctx.def(id).kind === "basic");
        const options = [{ key: "draw", label: "Draw 2 cards" }];
        if (basics.length > 0) {
          options.push({
            key: "bring",
            label: "Bring a Basic Unicorn from your hand into your Stable",
          });
        }
        const choice = await ctx.chooseOption(owner, options, {
          may: true,
          prompt: "First Mer-mate Unicorn:",
        });
        if (choice === "draw") await ctx.draw(owner, 2);
        if (choice === "bring") {
          const pick = await ctx.chooseInstance(owner, basics, {
            prompt: "Bring which Basic Unicorn into your Stable?",
          });
          if (pick) await ctx.moveUnicornToStable(pick, owner, { from: "hand" });
        }
      },
    },
  },
  "fisherman-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        const target = await ctx.choosePlayer(owner, otherPlayersWithCards(ctx, owner), {
          may: true,
          prompt: "Look at which player's hand?",
        });
        if (!target) return;
        const pick = await ctx.chooseInstance(owner, ctx.state.hands[target], {
          prompt: `Choose a card from ${ctx.playerName(target)}'s hand.`,
        });
        if (pick) ctx.takeToHand(owner, pick);
      },
    },
  },
  "hornswoggler-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        const options = [{ key: "redraw", label: "Discard your hand, then draw 3 cards" }];
        if (ctx.state.players.length > 1) {
          options.push({ key: "trade", label: "Trade hands with another player" });
        }
        const choice = await ctx.chooseOption(owner, options, {
          may: true,
          prompt: "Hornswoggler Unicorn:",
        });
        if (choice === "redraw") {
          for (const id of (ctx.state.hands[owner] ?? []).slice()) {
            await ctx.discardSpecific(id);
          }
          await ctx.draw(owner, 3);
        } else if (choice === "trade") {
          const others = ctx.state.players.filter((player) => player.id !== owner).map((p) => p.id);
          const target = await ctx.choosePlayer(owner, others, {
            prompt: "Trade hands with which player?",
          });
          if (!target) return;
          const myHand = ctx.state.hands[owner];
          ctx.state.hands[owner] = ctx.state.hands[target];
          ctx.state.hands[target] = myHand;
          for (const id of ctx.state.hands[owner]) ctx.instance(id).ownerId = owner;
          for (const id of ctx.state.hands[target]) ctx.instance(id).ownerId = target;
        }
      },
    },
  },
  "pillaging-pirate-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        const upgrades = cardsInPlay(
          ctx,
          (card) => ctx.def(card.instanceId).cardClass === "upgrade" && card.ownerId !== owner,
        );
        const downgrades = (ctx.state.stables[owner] ?? []).filter(
          (id) => ctx.def(id).cardClass === "downgrade",
        );
        const options = [];
        if (upgrades.length > 0) options.push({ key: "steal", label: "Steal an Upgrade card" });
        if (downgrades.length > 0) {
          options.push({ key: "move", label: "Move one of your Downgrades to another Stable" });
        }
        const choice = await ctx.chooseOption(owner, options, {
          may: true,
          prompt: "Pillaging Pirate Unicorn:",
        });
        if (choice === "steal") {
          const pick = await ctx.chooseInstance(owner, upgrades, {
            prompt: "Steal which Upgrade?",
          });
          if (pick) await ctx.steal(pick, owner);
        } else if (choice === "move") {
          const pick = await ctx.chooseInstance(owner, downgrades, {
            prompt: "Move which Downgrade?",
          });
          const players = ctx.state.players
            .filter((player) => player.id !== owner)
            .map((p) => p.id);
          const target = await ctx.choosePlayer(owner, players, {
            prompt: "Move it to which Stable?",
            stablePreviewInstanceId: pick ?? undefined,
          });
          if (pick && target) ctx.relocateCard(pick, target, "stable");
        }
      },
    },
  },
  "salty-seadogicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        const choice = await ctx.chooseOption(
          owner,
          [
            { key: "discard", label: "Force each other player to discard a card" },
            { key: "draw", label: "Draw a card" },
          ],
          { may: true, prompt: "Salty Seadogicorn:" },
        );
        if (choice === "draw") await ctx.draw(owner, 1);
        if (choice === "discard") {
          for (const player of ctx.playersInTurnOrderFrom(owner)) {
            if (player !== owner) await ctx.discardChoice(player, 1);
          }
        }
      },
    },
  },
  "stowaway-unicorn": {
    triggers: {
      onEnterStable: async (ctx, source) => {
        const owner = source.ownerId!;
        if (!(await ctx.yesNo(owner, "Stowaway Unicorn: draw and reveal a card?"))) return;
        const [drawn] = await ctx.draw(owner, 1);
        if (!drawn) return;
        ctx.log(`revealed ${ctx.def(drawn).name}`);
        if (["unicorn", "upgrade", "downgrade"].includes(ctx.def(drawn).cardClass)) {
          await bringCardIntoStable(ctx, drawn, owner);
        }
      },
    },
  },
  "survivalist-unicorn": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const downgrades = (ctx.state.stables[owner] ?? []).filter(
          (id) => ctx.def(id).cardClass === "downgrade",
        );
        if ((ctx.state.hands[owner] ?? []).length === 0 || downgrades.length === 0) return;
        if (!(await ctx.yesNo(owner, "Discard a card to sacrifice a Downgrade?"))) return;
        await ctx.discardChoice(owner, 1);
        const pick = await ctx.chooseInstance(owner, downgrades, {
          prompt: "Sacrifice which Downgrade?",
        });
        if (pick) await ctx.sacrifice(pick);
      },
    },
  },
  "vagabond-unicorn": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const players = otherPlayersWithCards(ctx, owner);
        if ((ctx.state.hands[owner] ?? []).length === 0 || players.length === 0) return;
        if (!(await ctx.yesNo(owner, "Discard a card to take a random card from another hand?"))) {
          return;
        }
        await ctx.discardChoice(owner, 1);
        const target = await ctx.choosePlayer(owner, players, {
          prompt: "Take a random card from which player?",
        });
        if (!target) return;
        const hand = ctx.state.hands[target];
        ctx.takeToHand(owner, hand[ctx.randomInt(hand.length)]);
      },
    },
  },
  "glowing-horn": {
    play: async (ctx) => {
      const mine = (ctx.state.stables[ctx.activePlayerId] ?? []).slice();
      const discard = ctx.state.discard.slice();
      const options = [];
      if (mine.length > 0) {
        options.push({ key: "destroy", label: "Sacrifice a card, then destroy a card" });
      }
      if (discard.length > 0) {
        options.push({
          key: "bring",
          label: "Bring a card from the discard pile into your Stable",
        });
      }
      const choice = await ctx.chooseOption(ctx.activePlayerId, options, {
        prompt: "Glowing Horn:",
      });
      if (choice === "bring") {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, discard, {
          prompt: "Bring which card into your Stable?",
        });
        if (pick) await bringCardIntoStable(ctx, pick, ctx.activePlayerId);
      } else if (choice === "destroy") {
        const sacrifice = await ctx.chooseInstance(ctx.activePlayerId, mine, {
          prompt: "Sacrifice which card?",
        });
        if (!sacrifice) return;
        const result = await ctx.sacrifice(sacrifice);
        if (!result.removed) return;
        const targets = cardsInPlay(ctx, (card) => ctx.isTargetable(card.instanceId, "targeted"));
        const target = await ctx.chooseInstance(ctx.activePlayerId, targets, {
          prompt: "Destroy which card?",
        });
        if (target) await ctx.destroy(target, { selection: "targeted", bySource: "magic" });
      }
    },
  },
  "metal-detector": {
    play: async (ctx) => {
      const options = [{ key: "draw", label: "Draw 3 cards, then discard a card" }];
      if (ctx.state.discard.length > 0) {
        options.push({ key: "recover", label: "Add a card from the discard pile to your hand" });
      }
      const choice = await ctx.chooseOption(ctx.activePlayerId, options, {
        prompt: "Metal Detector:",
      });
      if (choice === "draw") {
        await ctx.draw(ctx.activePlayerId, 3);
        await ctx.discardChoice(ctx.activePlayerId, 1);
      } else if (choice === "recover") {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, ctx.state.discard.slice(), {
          prompt: "Add which card to your hand?",
        });
        if (pick) ctx.takeToHand(ctx.activePlayerId, pick);
      }
    },
  },
  "mysterious-compass": {
    canPlay: (ctx) => {
      const canTakeTurn = (ctx.state.hands[ctx.activePlayerId] ?? []).length >= 3;
      const canTrade = (ctx.state.stables[ctx.activePlayerId] ?? []).some((id) =>
        isUnicorn(ctx.state, ctx.instance(id)),
      );
      return canTakeTurn || canTrade;
    },
    play: async (ctx) => {
      const owner = ctx.activePlayerId;
      const myUnicorns = (ctx.state.stables[owner] ?? []).filter((id) =>
        isUnicorn(ctx.state, ctx.instance(id)),
      );
      const options = [];
      if ((ctx.state.hands[owner] ?? []).length >= 3) {
        options.push({ key: "turn", label: "Discard 3 cards, then take another turn" });
      }
      if (myUnicorns.length > 0) {
        options.push({ key: "swap", label: "Move a Unicorn, then steal one from that Stable" });
      }
      const choice = await ctx.chooseOption(owner, options, { prompt: "Mysterious Compass:" });
      if (choice === "turn") {
        await ctx.discardChoice(owner, 3);
        ctx.grantExtraTurn(owner);
      } else if (choice === "swap") {
        const give = await ctx.chooseInstance(owner, myUnicorns, {
          prompt: "Move which Unicorn?",
        });
        if (!give) return;
        const others = ctx.state.players.filter((player) => player.id !== owner).map((p) => p.id);
        const target = await ctx.choosePlayer(owner, others, {
          prompt: "Move it to which Stable?",
          stablePreviewInstanceId: give,
        });
        if (!target) return;
        ctx.relocateCard(give, target, "stable");
        const take = (ctx.state.stables[target] ?? []).filter(
          (id) => isUnicorn(ctx.state, ctx.instance(id)) && ctx.isTargetable(id, "targeted"),
        );
        const pick = await ctx.chooseInstance(owner, take, {
          prompt: "Steal which Unicorn from that Stable?",
        });
        if (pick) await ctx.steal(pick, owner);
      }
    },
  },
  "silver-tongue": {
    play: async (ctx) => {
      const owner = ctx.activePlayerId;
      const choice = await ctx.chooseOption(
        owner,
        [
          { key: "reveal", label: "Reveal every other player's hand" },
          { key: "give", label: "Force every other player to give you a card" },
        ],
        { prompt: "Silver Tongue:" },
      );
      for (const player of ctx.playersInTurnOrderFrom(owner)) {
        if (player === owner || (ctx.state.hands[player] ?? []).length === 0) continue;
        if (choice === "reveal") {
          await ctx.chooseInstance(owner, ctx.state.hands[player], {
            may: true,
            prompt: `${ctx.playerName(player)} revealed their hand. Inspect the cards, then decline to continue.`,
          });
        } else if (choice === "give") {
          const pick = await ctx.chooseInstance(player, ctx.state.hands[player], {
            prompt: `Give a card to ${ctx.playerName(owner)}.`,
          });
          if (pick) ctx.takeToHand(owner, pick);
        }
      }
    },
  },
  "the-great-baby-heist": {
    canPlay: (ctx) =>
      (ctx.state.hands[ctx.activePlayerId] ?? []).length >= 2 && ctx.state.nursery.length >= 2,
    play: async (ctx) => {
      await ctx.discardChoice(ctx.activePlayerId, 2);
      for (let i = 0; i < 2; i++) {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, ctx.state.nursery.slice(), {
          prompt: "Bring a Baby Unicorn into your Stable.",
        });
        if (pick) {
          await ctx.moveUnicornToStable(pick, ctx.activePlayerId, { from: "nursery" });
        }
      }
    },
  },
  "unicorn-shovel": {
    canPlay: (ctx) =>
      cardsInDiscard(ctx, (definition) => definition.cardClass === "unicorn").length > 0,
    play: async (ctx) => {
      const unicorns = cardsInDiscard(ctx, (definition) => definition.cardClass === "unicorn");
      const options = [{ key: "bring", label: "Bring a Unicorn into your Stable" }];
      if (unicorns.length >= 2) {
        options.push({ key: "hand", label: "Add 2 Unicorn cards to your hand" });
      }
      const choice = await ctx.chooseOption(ctx.activePlayerId, options, {
        prompt: "Unicorn Shovel:",
      });
      if (choice === "bring") {
        const pick = await ctx.chooseInstance(ctx.activePlayerId, unicorns, {
          prompt: "Bring which Unicorn into your Stable?",
        });
        if (pick) await ctx.moveUnicornToStable(pick, ctx.activePlayerId, { from: "discard" });
      } else if (choice === "hand") {
        const picks = await ctx.chooseInstances(ctx.activePlayerId, unicorns, {
          prompt: "Add which 2 Unicorn cards to your hand?",
          minMax: [2, 2],
        });
        for (const id of picks) ctx.takeToHand(ctx.activePlayerId, id);
      }
    },
  },
  "ancient-ritual": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const unicorns = (ctx.state.stables[owner] ?? []).filter((id) =>
          isUnicorn(ctx.state, ctx.instance(id)),
        );
        const pick = await ctx.chooseInstance(owner, unicorns, {
          may: true,
          prompt: "Ancient Ritual: sacrifice a Unicorn to draw 3 cards?",
        });
        if (!pick) return;
        const result = await ctx.sacrifice(pick);
        if (result.removed) await ctx.draw(owner, 3);
      },
    },
  },
  "pit-covered-in-leaves": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        if (targetableUnicorns(ctx, owner).length === 0) return;
        if (!(await ctx.yesNo(owner, "Sacrifice Pit Covered in Leaves to steal a Unicorn?"))) {
          return;
        }
        const result = await ctx.sacrifice(source.instanceId);
        if (!result.removed) return;
        const pick = await ctx.chooseInstance(owner, targetableUnicorns(ctx, owner), {
          prompt: "Steal which Unicorn?",
        });
        if (pick) await ctx.steal(pick, owner);
      },
    },
  },
  "royal-hooves": {
    triggers: {
      beginningOfTurn: async (ctx, source) => {
        const owner = source.ownerId!;
        const target = await ctx.choosePlayer(owner, otherPlayersWithCards(ctx, owner), {
          may: true,
          prompt: "Royal Hooves: take a random card instead of drawing this turn?",
        });
        if (!target) return;
        const hand = ctx.state.hands[target];
        ctx.takeToHand(owner, hand[ctx.randomInt(hand.length)]);
        ctx.skipDrawPhase();
      },
    },
  },
  "unicorn-survival-kit": { aura: "survivalKit" },
  "broken-sundial": { aura: "brokenSundial" },
  "extremely-small-backpack": { aura: "smallBackpack" },
  "the-black-spot": { aura: "blackSpot" },
  "unicorn-overboard": { aura: "unicornOverboard" },
};
