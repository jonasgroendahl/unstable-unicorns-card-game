// Per-player sanitized view of the game state. Each client only ever sees its
// own hand (plus any hand made public by Nanny Cam), and the live pending
// decision / reaction relevant to it.

import { getDefinition } from "./cards";
import { handIsPublic, unicornCountFor, winThreshold } from "./derive";
import type { GameState, InstanceId, PendingDecision, PlayerId, ReactionState } from "./types";
import type { DeckId } from "./decks";

export interface CardView {
  instanceId: InstanceId;
  slug: string;
  name: string;
  kind: string;
  cardClass: string;
  text: string;
  image: string;
  ownerId: PlayerId | null;
  borrowed?: boolean;
}

export interface PlayerView {
  id: PlayerId;
  name: string;
  isBot: boolean;
  connected: boolean;
  isCurrent: boolean;
  unicornCount: number;
  /** Stable cards, fully visible (public zone). */
  stable: CardView[];
  /** Hand: full cards if visible to viewer, otherwise just the count. */
  handCount: number;
  hand: CardView[] | null;
}

export interface GameView {
  gameId: string;
  deckId: DeckId;
  status: GameState["status"];
  phase: GameState["phase"];
  viewerId: PlayerId;
  currentPlayerId: PlayerId;
  turnNumber: number;
  winThreshold: number;
  winnerId?: PlayerId;
  deckCount: number;
  discardTop: CardView | null;
  discardCount: number;
  nurseryCount: number;
  players: PlayerView[];
  actionsRemaining: { plays: number; draws: number };
  /** Mandatory beginning-of-turn card drawn for this viewer, if still relevant. */
  autoDrawnCardId: InstanceId | null;
  /** The decision THIS viewer must answer, if any. */
  decision: DecisionView | null;
  /** Whether someone (not necessarily the viewer) owes a decision. */
  someoneDeciding: { playerId: PlayerId; prompt: string } | null;
  reaction: ReactionView | null;
  log: GameState["log"];
}

export interface DecisionView extends PendingDecision {
  /** Resolved option cards for instance/option decisions (for rendering). */
  optionCards?: CardView[];
  /** Card rendered temporarily inside a hovered Stable destination. */
  stablePreviewCard?: CardView;
}

export interface ReactionView {
  targetCard: CardView | null;
  targetByPlayer: PlayerId;
  chain: { byPlayer: PlayerId; card: CardView }[];
  closesAt: number;
  /** Whether the viewer is allowed to respond right now. */
  canRespond: boolean;
  /** Instant cards in the viewer's hand they could play. */
  playableNeighs: CardView[];
}

function toCardView(state: GameState, id: InstanceId): CardView {
  const inst = state.instances[id];
  const def = getDefinition(inst.defId);
  return {
    instanceId: id,
    slug: def.id,
    name: def.name,
    kind: def.kind,
    cardClass: def.cardClass,
    text: def.text,
    image: def.image,
    ownerId: inst.ownerId,
    borrowed: Boolean(inst.borrowed),
  };
}

function instantsInHand(state: GameState, playerId: PlayerId): CardView[] {
  return (state.hands[playerId] ?? [])
    .filter((id) => getDefinition(state.instances[id].defId).cardClass === "instant")
    .map((id) => toCardView(state, id));
}

export function sanitizeFor(state: GameState, viewerId: PlayerId): GameView {
  const currentPlayerId = state.players[state.turnIndex]?.id ?? "";

  const players: PlayerView[] = state.players.map((p) => {
    const handVisible = p.id === viewerId || handIsPublic(state, p.id);
    return {
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      connected: p.connected,
      isCurrent: p.id === currentPlayerId,
      unicornCount: unicornCountFor(state, p.id),
      stable: (state.stables[p.id] ?? []).map((id) => toCardView(state, id)),
      handCount: (state.hands[p.id] ?? []).length,
      hand: handVisible ? (state.hands[p.id] ?? []).map((id) => toCardView(state, id)) : null,
    };
  });

  const liveDecision = state.pendingDecisions[state.pendingDecisions.length - 1] ?? null;
  let decision: DecisionView | null = null;
  if (liveDecision && liveDecision.playerId === viewerId) {
    decision = { ...liveDecision };
    if (liveDecision.kind === "chooseInstance") {
      decision.optionCards = liveDecision.options
        .filter((id) => state.instances[id])
        .map((id) => toCardView(state, id));
    }
    if (
      liveDecision.stablePreviewInstanceId &&
      state.instances[liveDecision.stablePreviewInstanceId]
    ) {
      decision.stablePreviewCard = toCardView(state, liveDecision.stablePreviewInstanceId);
    }
  }

  const someoneDeciding =
    liveDecision && liveDecision.playerId !== viewerId
      ? { playerId: liveDecision.playerId, prompt: liveDecision.prompt }
      : null;

  let reaction: ReactionView | null = null;
  if (state.reaction) {
    reaction = buildReactionView(state, viewerId, state.reaction);
  }

  return {
    gameId: state.gameId,
    deckId: state.deckId,
    status: state.status,
    phase: state.phase,
    viewerId,
    currentPlayerId,
    turnNumber: state.turnNumber,
    winThreshold: winThreshold(state),
    winnerId: state.winnerId,
    deckCount: state.deck.length,
    discardTop:
      state.discard.length > 0 ? toCardView(state, state.discard[state.discard.length - 1]) : null,
    discardCount: state.discard.length,
    nurseryCount: state.nursery.length,
    players,
    actionsRemaining: state.actionsRemaining,
    autoDrawnCardId:
      state.lastAutoDrawn?.playerId === viewerId &&
      state.lastAutoDrawn.turnNumber === state.turnNumber
        ? state.lastAutoDrawn.instanceId
        : null,
    decision,
    someoneDeciding,
    reaction,
    log: state.log.slice(-40),
  };
}

function buildReactionView(state: GameState, viewerId: PlayerId, rx: ReactionState): ReactionView {
  return {
    targetCard: state.instances[rx.targetInstanceId]
      ? toCardView(state, rx.targetInstanceId)
      : null,
    targetByPlayer: rx.targetByPlayer,
    chain: rx.chain.map((l) => ({
      byPlayer: l.byPlayer,
      card: toCardView(state, l.instanceId),
    })),
    closesAt: rx.closesAt,
    canRespond: rx.awaitingFrom.includes(viewerId),
    playableNeighs: rx.awaitingFrom.includes(viewerId) ? instantsInHand(state, viewerId) : [],
  };
}
