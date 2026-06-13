// Public entry point for the game module: create games, drive bots, sanitize views.

import { runBots } from "./ai/bot";
import { GameEngine } from "./engine/GameEngine";
import { randomSeed } from "./rng";
import { createInitialState, type SeatConfig } from "./state";
import { sanitizeFor, type GameView } from "./view";
import type { GameState, PlayerId } from "./types";
import { DEFAULT_DECK_ID, type DeckId } from "./decks";

export { GameEngine } from "./engine/GameEngine";
export { EngineError } from "./engine/GameEngine";
export type { GameView, PlayerView, CardView, DecisionView, ReactionView } from "./view";
export { sanitizeFor } from "./view";
export { allDefinitions, getDefinition } from "./cards";
export {
  DECK_OPTIONS,
  DECKS,
  DEFAULT_DECK_ID,
  definitionsForDeck,
  isDeckId,
  isExcludedInTwoPlayer,
} from "./decks";
export type { DeckId } from "./decks";
export type * from "./types";

export interface CreateGameOptions {
  gameId: string;
  seats: SeatConfig[];
  seed?: number;
  deckId?: DeckId;
}

/** Build a fresh engine, deal the game, wire the bot auto-responder, begin turn 1. */
export function createGame(opts: CreateGameOptions): GameEngine {
  const seed = opts.seed ?? randomSeed();
  const state = createInitialState(opts.seats, seed, opts.gameId, opts.deckId ?? DEFAULT_DECK_ID);
  const engine = new GameEngine(state);
  engine.onBotTurn = () => runBots(engine);
  // Kick off the first turn's beginning/draw phases.
  void engine.startTurn();
  // Prime bots in case player 1 is a bot.
  runBots(engine);
  return engine;
}

export function viewFor(state: GameState, viewerId: PlayerId): GameView {
  return sanitizeFor(state, viewerId);
}
