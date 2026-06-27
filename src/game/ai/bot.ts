// Simple AI bot: an auto-responder driven off the same engine surface as humans.
//
// The engine calls `runBots` (via onBotTurn) after every broadcast. The bot:
//  - answers a pending decision it owes,
//  - responds to an open reaction window it's eligible for,
//  - takes its action when it's the bot's turn in the action phase.
//
// Heuristics are intentionally light ("play legally, prefer progress").

import { getDefinition } from "../cards";
import { isUnicorn } from "../derive";
import type { GameEngine } from "../engine/GameEngine";
import type { GameState, PendingDecision, PlayerId } from "../types";

export const BOT_ACTION_DELAY_MS = 800;

const scheduledTurns = new WeakMap<GameEngine, ReturnType<typeof setTimeout>>();
const activeActions = new WeakSet<GameEngine>();

type BotStep = "decision" | "reaction" | "action";

function isBot(state: GameState, id: PlayerId): boolean {
  return state.players.find((p) => p.id === id)?.isBot ?? false;
}

/** Pick a decision answer for a bot. */
function decideAnswer(state: GameState, d: PendingDecision): string | string[] | boolean | null {
  if (d.kind === "yesNo") {
    // Be opportunistic: say yes to beneficial prompts (most "may" effects help).
    return true;
  }
  const [min, max] = d.minMax ?? [1, 1];
  if (d.options.length === 0) return d.may ? null : null;

  // Score instance options: prefer destroying opponents' strong unicorns, keep own.
  const ranked = [...d.options].sort((a, b) => scoreOption(state, d, b) - scoreOption(state, d, a));

  if (max > 1 || min > 1) {
    return ranked.slice(0, Math.max(min, Math.min(max, ranked.length)));
  }
  return ranked[0] ?? (d.may ? null : null);
}

function scoreOption(state: GameState, d: PendingDecision, opt: string): number {
  // Player options: prefer the player with the most unicorns (target the leader).
  if (d.kind === "choosePlayer") {
    const stable = state.stables[opt] ?? [];
    return stable.filter((id) => isUnicorn(state, state.instances[id])).length;
  }
  if (d.kind === "chooseInstance") {
    const inst = state.instances[opt];
    if (!inst) return 0;
    const def = getDefinition(inst.defId);
    const mine = inst.ownerId === d.playerId;
    // Loosely: prefer high-value, not-mine cards for destroy-style prompts.
    let score = def.kind === "magical" ? 3 : def.kind === "basic" ? 1 : 2;
    if (mine) score -= 5; // avoid sacrificing my own good stuff when possible
    return score;
  }
  return 0;
}

/**
 * Schedule one bot step after a short presentation delay.
 *
 * Broadcasts and client nudges can both reach this function for the same state,
 * so each engine may have at most one scheduled or active step.
 */
export function runBots(engine: GameEngine, delayMs = BOT_ACTION_DELAY_MS): void {
  const step = botStepFor(engine.state);
  if (!step || scheduledTurns.has(engine) || (step === "action" && activeActions.has(engine))) {
    return;
  }

  const timer = setTimeout(
    () => {
      scheduledTurns.delete(engine);
      const currentStep = botStepFor(engine.state);
      if (!currentStep || (currentStep === "action" && activeActions.has(engine))) return;

      if (currentStep === "action") activeActions.add(engine);
      void takeBotStep(engine).finally(() => {
        if (currentStep === "action") activeActions.delete(engine);
        runBots(engine, delayMs);
      });
    },
    Math.max(0, delayMs),
  );
  scheduledTurns.set(engine, timer);
}

function botStepFor(state: GameState): BotStep | null {
  if (state.status !== "active") return null;

  const decision = state.pendingDecisions[state.pendingDecisions.length - 1];
  if (decision && isBot(state, decision.playerId)) return "decision";

  if (state.reaction?.awaitingFrom.some((id) => isBot(state, id))) return "reaction";

  const current = state.players[state.turnIndex];
  return current?.isBot && state.phase === "action" && state.actionsRemaining.plays > 0
    ? "action"
    : null;
}

async function takeBotStep(engine: GameEngine): Promise<void> {
  const state = engine.state;
  if (state.status !== "active") return;

  // 1. Live decision owed by a bot?
  const decision = state.pendingDecisions[state.pendingDecisions.length - 1];
  if (decision && isBot(state, decision.playerId)) {
    const answer = decideAnswer(state, decision);
    try {
      engine.submitDecision(decision.playerId, answer);
    } catch {
      /* race with a human resolution — ignore */
    }
    return;
  }

  // 2. Open reaction window a bot can respond to?
  if (state.reaction) {
    const botResponder = state.reaction.awaitingFrom.find((id) => isBot(state, id));
    if (botResponder) {
      // Bots Neigh ~35% of the time when they hold a Neigh, deterministically by seed.
      const hand = state.hands[botResponder] ?? [];
      const neigh = hand.find((id) => getDefinition(state.instances[id].defId).id === "neigh");
      const wantsNeigh = neigh && shouldNeigh(state, botResponder);
      try {
        engine.submitReaction(botResponder, wantsNeigh ? neigh! : null);
      } catch {
        /* ignore */
      }
      return;
    }
  }

  // 3. Bot's action phase?
  const current = state.players[state.turnIndex];
  if (current?.isBot && state.phase === "action" && state.actionsRemaining.plays > 0) {
    await takeBotAction(engine, current.id).catch(() => {});
  }
}

function shouldNeigh(state: GameState, _botId: PlayerId): boolean {
  // Light heuristic: Neigh the leader's plays. Use the seed for determinism.
  // (Cheap pseudo-random based on turn + chain length.)
  const n = (state.turnNumber + (state.reaction?.chain.length ?? 0)) % 3;
  return n === 0;
}

async function takeBotAction(engine: GameEngine, botId: PlayerId): Promise<void> {
  const state = engine.state;
  const hand = state.hands[botId] ?? [];

  // Prefer to play a Unicorn (progress toward winning), then upgrades, then magic.
  const order = ["magical", "basic", "upgrade", "magic", "downgrade"];
  const playable = hand
    .map((id) => ({ id, def: getDefinition(state.instances[id].defId) }))
    .filter((c) => c.def.cardClass !== "instant")
    .sort((a, b) => order.indexOf(a.def.kind) - order.indexOf(b.def.kind));

  // Try candidates in priority order. The engine validates legality (canPlay,
  // no-legal-target, etc.) and rejects illegal plays *before* it broadcasts —
  // so we must await each attempt and fall through to the next on failure.
  // Bailing after the first card (without awaiting) would deadlock the bot's
  // turn whenever its top-priority card has no legal target.
  for (const c of playable) {
    try {
      await engine.playCard(botId, c.id);
      return; // A successful play re-broadcasts and re-drives runBots.
    } catch {
      /* illegal play — try the next candidate */
    }
  }

  // Nothing legal to play. If we haven't played yet, draw-for-turn (ends the
  // turn); otherwise drawing is illegal this turn, so just end the turn.
  if (engine.state.playedThisTurn) {
    await engine.endTurn(botId).catch(() => {});
  } else {
    await engine.drawForTurn(botId).catch(() => {});
  }
}
