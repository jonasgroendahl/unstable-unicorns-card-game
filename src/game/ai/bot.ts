// Simple AI bot: an auto-responder driven off the same engine surface as humans.
//
// The engine calls `runBots` (via onBotTurn) after every broadcast. The bot:
//  - answers a pending decision it owes,
//  - responds to an open reaction window it's eligible for,
//  - takes its action when it's the bot's turn in the action phase.
//
// Difficulty-aware strategy is pure and isolated in strategy.ts; this module
// only handles engine pacing, deduplication, and executing selected actions.

import type { GameEngine } from "../engine/GameEngine";
import type { GameState, PlayerId } from "../types";
import {
  chooseBotDecision,
  chooseBotReaction,
  createBotObservation,
  rankBotActions,
} from "./strategy";

export const BOT_ACTION_DELAY_MS = 1_500;

const scheduledTurns = new WeakMap<GameEngine, ReturnType<typeof setTimeout>>();
const activeActions = new WeakSet<GameEngine>();

type BotStep = "decision" | "reaction" | "action";

function isBot(state: GameState, id: PlayerId): boolean {
  return state.players.find((p) => p.id === id)?.isBot ?? false;
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
    const answer = chooseBotDecision(createBotObservation(state, decision.playerId));
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
      const neigh = chooseBotReaction(createBotObservation(state, botResponder));
      try {
        engine.submitReaction(botResponder, neigh);
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

async function takeBotAction(engine: GameEngine, botId: PlayerId): Promise<void> {
  const actions = rankBotActions(createBotObservation(engine.state, botId));
  for (const action of actions) {
    if (action.kind === "draw") {
      await engine.drawForTurn(botId).catch(() => {});
      return;
    }
    try {
      await engine.playCard(botId, action.instanceId);
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
