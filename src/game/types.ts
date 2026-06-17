// Core type model for the Unstable Unicorns engine.
//
// Two-layer card model (see plan pitfall #4):
//   CardDefinition = immutable rules/behavior, one per slug.
//   CardInstance   = a physical card in a game, with mutable zone/owner/runtime state.

import type { CardKind } from "./cards/cardData";
import type { DeckId } from "./decks";

export type { CardKind };

export type PlayerId = string;
export type InstanceId = string;
export type DefId = string; // === card slug

export type Zone = "deck" | "hand" | "stable" | "discard" | "nursery" | "resolving";

export type Phase = "beginning" | "draw" | "action" | "end";

export type GameStatus = "lobby" | "active" | "finished" | "error";

/** Broad category used by targeting / "is this a Unicorn?" checks. */
export type CardClass = "unicorn" | "magic" | "upgrade" | "downgrade" | "instant";

// ---------------------------------------------------------------------------
// Card definition (behavior)
// ---------------------------------------------------------------------------

/**
 * How a destroy/sacrifice attempt is selecting its victim. Pandamonium makes a
 * player's unicorns immune to effects that TARGET a specific unicorn, but not to
 * "each player sacrifices one of their own" (self-selected) effects.
 */
export type SelectionKind = "targeted" | "self" | "mass";

export type AuraKind =
  | "ginormous" // counts as 2 unicorns; controller can't play Neighs
  | "queenBee" // basic unicorns can't enter other players' stables
  | "pandamonium" // your unicorns are Pandas: don't count toward victory; immune to targeted effects
  | "blindingLight" // your unicorns are basic with no effects
  | "yay" // cards you play can't be Neigh'd
  | "slowdown" // you can't play Neighs
  | "brokenStable" // you can't play Upgrades
  | "nannyCam" // your hand is public
  | "rainbowAura" // your unicorns can't be destroyed
  | "tinyStable" // >5 unicorns => sacrifice down (state-based)
  | "barbedWire"; // unicorn enter/leave your stable => discard a card

/** Replacement-effect participation resolved inside destroy()/sacrifice(). */
export type ReplacementKind =
  | "blackKnight" // may sacrifice this instead to save a different unicorn (destroy only)
  | "phoenix" // may discard a card instead (sacrifice or destroy)
  | "babyReturn" // baby unicorns: return to Nursery instead of dying
  | "returnToHand"; // flying unicorns: return to hand instead of dying

export type TriggerKind =
  | "onEnterStable"
  | "beginningOfTurn"
  | "endOfTurn"
  | "onSacrificedOrDestroyed";

/** An effect is a live async function that mutates state via the context. */
export type Effect = (ctx: EffectContext, source: CardInstance) => Promise<void>;

export interface CardDefinition {
  id: DefId;
  name: string;
  kind: CardKind;
  cardClass: CardClass;
  text: string;
  image: string;
  copies: number;

  /** Triggered effects keyed by when they fire. */
  triggers?: Partial<Record<TriggerKind, Effect>>;
  /** Magic cards: the spell resolved when played. */
  play?: Effect;
  /** Continuous/static aura contributed while in a stable. */
  aura?: AuraKind;
  /** Replacement effects this card participates in. */
  replacement?: ReplacementKind[];
  /** Legality gate checked before the card may be played (e.g. needs a Basic Unicorn). */
  canPlay?: (ctx: EffectContext, source: CardInstance) => boolean;
  /** Instant cards that cannot be Neigh'd (Super Neigh). */
  unneighable?: boolean;
  /** Extra action economy while in a stable at beginning of turn. */
  grantsExtraPlays?: number;
  grantsExtraDraws?: number;
  /** Ginormous counts as 2 toward unicorn totals. */
  unicornValue?: number;
  /** Magical Kittencorn: cannot be destroyed by Magic cards. */
  cantBeDestroyedByMagic?: boolean;
  /** Puppicorn: cannot be sacrificed or destroyed, and relocates each turn. */
  cantBeSacrificedOrDestroyed?: boolean;
}

// ---------------------------------------------------------------------------
// Card instance (a physical card in a game)
// ---------------------------------------------------------------------------

export interface BorrowState {
  byPlayer: PlayerId;
  originalOwner: PlayerId;
  /** Returned at the beginning of this player's next turn (Unicorn Lasso). */
  returnAtTurnOf: PlayerId;
}

export interface CardInstance {
  instanceId: InstanceId;
  defId: DefId;
  zone: Zone;
  /** Controller while in hand/stable; null in shared zones. */
  ownerId: PlayerId | null;
  /** Turn number this card entered its current stable (for timing/animation). */
  enteredTurn?: number;
  /** Unicorn Lasso bookkeeping. */
  borrowed?: BorrowState;
}

// ---------------------------------------------------------------------------
// Pending decisions (the engine parks here awaiting player/bot input)
// ---------------------------------------------------------------------------

export type DecisionKind =
  | "chooseInstance" // pick card instance(s) — options are instanceIds
  | "choosePlayer" // pick player(s) — options are playerIds
  | "chooseOption" // pick from arbitrary string keys
  | "yesNo"; // confirm / decline

export interface PendingDecision {
  id: string;
  playerId: PlayerId; // who must answer (NOT necessarily the turn-holder)
  kind: DecisionKind;
  prompt: string;
  /** Legal option ids/keys. Never opened when empty (see ctx.choose*). */
  options: string[];
  /** Human labels per option key (for arbitrary chooseOption menus). */
  optionLabels?: Record<string, string>;
  /** Selection cardinality [min, max]. Default [1, 1]. */
  minMax?: [number, number];
  /** "may" effects show a Decline button. */
  may?: boolean;
  /** The card that triggered this decision (UI + log). */
  sourceInstanceId?: InstanceId;
  /** Card to preview inside a hovered Stable while choosing its destination. */
  stablePreviewInstanceId?: InstanceId;
}

// ---------------------------------------------------------------------------
// Reaction (Neigh) window
// ---------------------------------------------------------------------------

export const REACTION_WINDOW_MS = 20_000;

export interface ReactionLink {
  instanceId: InstanceId; // the Neigh/Super Neigh card played
  byPlayer: PlayerId;
}

export interface ReactionState {
  /** The card being reacted to lives at index 0; subsequent links are Neighs. */
  targetInstanceId: InstanceId;
  targetByPlayer: PlayerId;
  chain: ReactionLink[];
  /** Players who still might respond to the current top of chain. */
  awaitingFrom: PlayerId[];
  /** Epoch ms when the window auto-closes. */
  closesAt: number;
}

// ---------------------------------------------------------------------------
// Game log
// ---------------------------------------------------------------------------

export interface GameEvent {
  t: number; // sequence number
  kind: string;
  message: string;
  playerId?: PlayerId;
  instanceId?: InstanceId;
}

// ---------------------------------------------------------------------------
// Game state (fully serializable; no functions/promises live here)
// ---------------------------------------------------------------------------

export interface GamePlayer {
  id: PlayerId;
  name: string;
  isBot: boolean;
  connected: boolean;
}

export interface GameState {
  gameId: string;
  deckId: DeckId;
  rngSeed: number; // advanced by every shuffle/random draw
  players: GamePlayer[]; // seating order
  instances: Record<InstanceId, CardInstance>;

  // Ordered zone membership (top of deck = last element).
  deck: InstanceId[];
  discard: InstanceId[];
  nursery: InstanceId[];
  /** Played one-shot cards while their effects are resolving. */
  resolving: InstanceId[];
  hands: Record<PlayerId, InstanceId[]>;
  stables: Record<PlayerId, InstanceId[]>;

  turnIndex: number; // index into players
  turnNumber: number; // monotonic, for timing
  pendingTurns: PlayerId[]; // extra turns (Change of Luck)
  phase: Phase;
  actionsRemaining: { plays: number; draws: number };
  /** Whether the active player has played a card this turn. Drawing-for-turn is
   * mutually exclusive with playing (e.g. Double Dutch: play 1–2 cards OR draw 1). */
  playedThisTurn: boolean;
  /** Latest mandatory beginning-of-turn draw, used for the owner's UI cue. */
  lastAutoDrawn: { playerId: PlayerId; instanceId: InstanceId; turnNumber: number } | null;

  pendingDecisions: PendingDecision[]; // STACK; top = live
  reaction: ReactionState | null;

  status: GameStatus;
  winnerId?: PlayerId;
  log: GameEvent[];
}

// ---------------------------------------------------------------------------
// Effect execution context (provided by the engine to card effects)
// ---------------------------------------------------------------------------

export interface ChooseInstanceOpts {
  may?: boolean;
  prompt: string;
  minMax?: [number, number];
}

export interface ChoosePlayerOpts {
  may?: boolean;
  prompt: string;
  stablePreviewInstanceId?: InstanceId;
}

/**
 * The interface card effects use to read/mutate the game. All target-selection
 * helpers compute legal options and resolve immediately to null/[] when empty,
 * so effects never hang on an impossible choice.
 */
export interface EffectContext {
  readonly state: GameState;
  readonly activePlayerId: PlayerId;

  // --- queries ---
  def(instanceId: InstanceId): CardDefinition;
  instance(instanceId: InstanceId): CardInstance;
  log(message: string, extra?: Partial<GameEvent>): void;
  playerName(playerId: PlayerId): string;
  /** Players starting from the given player, in clockwise seating order. */
  playersInTurnOrderFrom(playerId: PlayerId): PlayerId[];
  /** Whether an instance can be selected by an effect of this selection kind. */
  isTargetable(instanceId: InstanceId, selection: SelectionKind): boolean;
  /** A seeded random integer in [0, n) (advances the game's rng seed). */
  randomInt(n: number): number;
  /** Move a card between zones WITHOUT firing enter/leave triggers (raw relocation). */
  relocateCard(instanceId: InstanceId, ownerId: PlayerId | null, zone: Zone): void;

  // --- primitive mutators (all async; route through chokepoints) ---
  draw(playerId: PlayerId, n?: number): Promise<InstanceId[]>;
  discardChoice(
    playerId: PlayerId,
    n?: number,
    opts?: { may?: boolean; filter?: (c: CardInstance) => boolean },
  ): Promise<InstanceId[]>;
  discardSpecific(instanceId: InstanceId): Promise<void>;
  destroy(
    instanceId: InstanceId,
    opts: { selection: SelectionKind; bySource?: CardClass },
  ): Promise<{ removed: boolean; prevented: boolean }>;
  sacrifice(instanceId: InstanceId): Promise<{ removed: boolean; prevented: boolean }>;
  moveUnicornToStable(
    instanceId: InstanceId,
    ownerId: PlayerId,
    opts?: { from?: Zone },
  ): Promise<boolean>;
  returnToHand(instanceId: InstanceId): Promise<void>;
  steal(instanceId: InstanceId, toPlayerId: PlayerId): Promise<boolean>;
  attachToStable(instanceId: InstanceId, ownerId: PlayerId): void;
  /** Move a card from any zone into a player's hand (no triggers). */
  takeToHand(playerId: PlayerId, instanceId: InstanceId): void;

  // --- choices (park the effect awaiting input) ---
  chooseInstance(
    playerId: PlayerId,
    options: InstanceId[],
    opts: ChooseInstanceOpts,
  ): Promise<InstanceId | null>;
  chooseInstances(
    playerId: PlayerId,
    options: InstanceId[],
    opts: ChooseInstanceOpts,
  ): Promise<InstanceId[]>;
  choosePlayer(
    playerId: PlayerId,
    options: PlayerId[],
    opts: ChoosePlayerOpts,
  ): Promise<PlayerId | null>;
  chooseOption(
    playerId: PlayerId,
    options: { key: string; label: string }[],
    opts: { may?: boolean; prompt: string },
  ): Promise<string | null>;
  yesNo(playerId: PlayerId, prompt: string): Promise<boolean>;

  // --- turn control ---
  endTurnNow(): never; // throws EndTurnSignal
  grantExtraTurn(playerId: PlayerId): void;

  // --- deck/search ---
  searchDeck(
    playerId: PlayerId,
    filter: (def: CardDefinition) => boolean,
    opts: { may?: boolean; prompt: string },
  ): Promise<InstanceId | null>;
  shuffleDeck(): void;
  shuffleDiscardIntoDeck(): void;
}
