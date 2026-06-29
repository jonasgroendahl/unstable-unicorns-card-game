import { getDefinition } from "../cards";
import { unicornCountFor, winThreshold } from "../derive";
import type {
  BotDifficulty,
  CardClass,
  CardKind,
  DecisionIntent,
  GameState,
  InstanceId,
  PendingDecision,
  PlayerId,
  ReactionLink,
  Zone,
} from "../types";
import { DEFAULT_BOT_DIFFICULTY } from "../types";

export interface ObservedCard {
  instanceId: InstanceId;
  defId: string;
  kind: CardKind;
  cardClass: CardClass;
  ownerId: PlayerId | null;
  zone: Zone;
}

export interface ObservedPlayer {
  id: PlayerId;
  unicornCount: number;
  handCount: number;
  stableIds: InstanceId[];
}

/**
 * The policy's deliberately restricted view of a game. Opponent hand identities
 * and deck order never enter this object; decision options are included because
 * those cards have been explicitly revealed to the choosing player.
 */
export interface BotObservation {
  gameId: string;
  botId: PlayerId;
  difficulty: BotDifficulty;
  turnNumber: number;
  playedThisTurn: boolean;
  winThreshold: number;
  handIds: InstanceId[];
  cards: Record<InstanceId, ObservedCard>;
  players: ObservedPlayer[];
  decision: PendingDecision | null;
  reaction: {
    targetInstanceId: InstanceId;
    targetByPlayer: PlayerId;
    chain: ReactionLink[];
  } | null;
}

export type RankedBotAction =
  | { kind: "play"; instanceId: InstanceId; score: number }
  | { kind: "draw"; score: number };

const STRATEGIC_CARD_VALUE: Record<string, number> = {
  "change-of-luck": 8,
  "double-dutch": 9,
  "ginormous-unicorn": 10,
  "glitter-bomb": 7,
  "kiss-of-life": 8,
  "mother-goose-unicorn": 8,
  "rainbow-aura": 8,
  "rainbow-lasso": 8,
  "rainbow-mane": 8,
  "rainbow-unicorn": 9,
  "seductive-unicorn": 9,
  "stable-artillery": 7,
  "super-neigh": 10,
  "two-for-one": 7,
  yay: 10,
};

const ATTACK_CARDS = new Set([
  "back-kick",
  "blatant-thievery",
  "glitter-tornado",
  "re-target",
  "reset-button",
  "targeted-destruction",
  "two-for-one",
  "unicorn-poison",
  "unicorn-shrinkray",
  "unicorn-swap",
]);

const BURST_UNICORNS = new Set([
  "ginormous-unicorn",
  "mother-goose-unicorn",
  "rainbow-unicorn",
  "seductive-unicorn",
]);

export function botDifficultyFor(state: GameState, botId: PlayerId): BotDifficulty {
  return (
    state.players.find((player) => player.id === botId)?.botDifficulty ?? DEFAULT_BOT_DIFFICULTY
  );
}

export function createBotObservation(state: GameState, botId: PlayerId): BotObservation {
  const decision =
    state.pendingDecisions.at(-1)?.playerId === botId ? state.pendingDecisions.at(-1)! : null;
  const visibleIds = new Set<InstanceId>([
    ...(state.hands[botId] ?? []),
    ...state.discard,
    ...state.nursery,
    ...state.resolving,
    ...state.players.flatMap((player) => state.stables[player.id] ?? []),
    ...(decision?.options.filter((id) => state.instances[id]) ?? []),
  ]);

  if (state.reaction) {
    visibleIds.add(state.reaction.targetInstanceId);
    for (const link of state.reaction.chain) visibleIds.add(link.instanceId);
  }

  const cards: Record<InstanceId, ObservedCard> = {};
  for (const id of visibleIds) {
    const instance = state.instances[id];
    if (!instance) continue;
    const definition = getDefinition(instance.defId);
    cards[id] = {
      instanceId: id,
      defId: definition.id,
      kind: definition.kind,
      cardClass: definition.cardClass,
      ownerId: instance.ownerId,
      zone: instance.zone,
    };
  }

  return {
    gameId: state.gameId,
    botId,
    difficulty: botDifficultyFor(state, botId),
    turnNumber: state.turnNumber,
    playedThisTurn: state.playedThisTurn,
    winThreshold: winThreshold(state),
    handIds: [...(state.hands[botId] ?? [])],
    cards,
    players: state.players.map((player) => ({
      id: player.id,
      unicornCount: unicornCountFor(state, player.id),
      handCount: (state.hands[player.id] ?? []).length,
      stableIds: [...(state.stables[player.id] ?? [])],
    })),
    decision,
    reaction: state.reaction
      ? {
          targetInstanceId: state.reaction.targetInstanceId,
          targetByPlayer: state.reaction.targetByPlayer,
          chain: [...state.reaction.chain],
        }
      : null,
  };
}

export function rankBotActions(observation: BotObservation): RankedBotAction[] {
  const playable = observation.handIds
    .map((instanceId) => observation.cards[instanceId])
    .filter((card): card is ObservedCard => Boolean(card) && card.cardClass !== "instant");

  if (observation.difficulty === "easy") {
    const order: CardKind[] = ["magical", "basic", "upgrade", "magic", "downgrade"];
    const ranked: RankedBotAction[] = playable
      .sort(
        (left, right) =>
          order.indexOf(left.kind) - order.indexOf(right.kind) ||
          left.instanceId.localeCompare(right.instanceId),
      )
      .map((card, index) => ({
        kind: "play" as const,
        instanceId: card.instanceId,
        score: order.length - index,
      }));
    if (!observation.playedThisTurn) ranked.push({ kind: "draw", score: -1 });
    return ranked;
  }

  const ranked: RankedBotAction[] = playable.map((card) => ({
    kind: "play",
    instanceId: card.instanceId,
    score:
      scoreCardPlay(observation, card) +
      (observation.difficulty === "medium"
        ? deterministicFraction(
            `${observation.gameId}:${observation.turnNumber}:${card.instanceId}`,
          ) * 1.5
        : 0),
  }));

  if (!observation.playedThisTurn) {
    ranked.push({ kind: "draw", score: scoreDraw(observation) });
  }

  return ranked.sort(
    (left, right) =>
      right.score - left.score ||
      (left.kind === "play" ? left.instanceId : "~draw").localeCompare(
        right.kind === "play" ? right.instanceId : "~draw",
      ),
  );
}

export function chooseBotDecision(observation: BotObservation): string | string[] | boolean | null {
  const decision = observation.decision;
  if (!decision) return null;
  if (decision.kind === "yesNo") return chooseYesNo(observation, decision);
  if (decision.options.length === 0) return null;

  const ranked = [...decision.options].sort(
    (left, right) =>
      scoreDecisionOption(observation, decision, right) -
        scoreDecisionOption(observation, decision, left) || left.localeCompare(right),
  );
  const [min, max] = decision.minMax ?? [1, 1];
  if (max > 1 || min > 1) {
    return ranked.slice(0, Math.max(min, Math.min(max, ranked.length)));
  }
  return ranked[0] ?? null;
}

export function chooseBotReaction(observation: BotObservation): InstanceId | null {
  const reaction = observation.reaction;
  if (!reaction) return null;

  const instants = observation.handIds
    .map((id) => observation.cards[id])
    .filter(
      (card): card is ObservedCard => card?.defId === "neigh" || card?.defId === "super-neigh",
    );
  if (instants.length === 0) return null;

  if (observation.difficulty === "easy") {
    const regularNeigh = instants.find((card) => card.defId === "neigh");
    return (observation.turnNumber + reaction.chain.length) % 3 === 0
      ? (regularNeigh?.instanceId ?? null)
      : null;
  }

  const target = observation.cards[reaction.targetInstanceId];
  if (!target) return null;
  const targetPlayer = player(observation, reaction.targetByPlayer);
  const targetValue = cardValue(target);
  const unicornGain = getDefinition(target.defId).unicornValue ?? 1;
  const immediateWin =
    target.cardClass === "unicorn" &&
    Boolean(targetPlayer && targetPlayer.unicornCount + unicornGain >= observation.winThreshold);
  const nearWin =
    Boolean(targetPlayer) &&
    observation.winThreshold - targetPlayer!.unicornCount <= 2 &&
    (target.cardClass === "unicorn" || BURST_UNICORNS.has(target.defId));
  const important =
    immediateWin ||
    nearWin ||
    targetValue >= (observation.difficulty === "hard" ? 8 : 10) ||
    (ATTACK_CARDS.has(target.defId) && targetValue >= 6);
  if (!important) return null;

  const botPlayedTarget = reaction.targetByPlayer === observation.botId;
  const targetCurrentlyResolves = reaction.chain.length % 2 === 0;
  const desiredResolution = botPlayedTarget;
  if (targetCurrentlyResolves === desiredResolution) return null;

  const superNeigh = instants.find((card) => getDefinition(card.defId).unneighable);
  if (observation.difficulty === "hard" && immediateWin && superNeigh) {
    return superNeigh.instanceId;
  }
  return (
    instants.find((card) => !getDefinition(card.defId).unneighable)?.instanceId ??
    instants[0].instanceId
  );
}

function scoreCardPlay(observation: BotObservation, card: ObservedCard): number {
  const definition = getDefinition(card.defId);
  const me = player(observation, observation.botId)!;
  const leader = strongestOpponent(observation);
  const distanceToWin = observation.winThreshold - me.unicornCount;
  let score = cardValue(card);

  if (card.cardClass === "unicorn") {
    const gain = definition.unicornValue ?? 1;
    if (gain >= distanceToWin) score += 100;
    if (BURST_UNICORNS.has(card.defId) && distanceToWin <= 3) score += 22;
    if (
      observation.difficulty === "hard" &&
      card.kind === "basic" &&
      me.unicornCount >= 4 &&
      gain < distanceToWin
    ) {
      score -= 5;
    }
  }

  if (leader && observation.winThreshold - leader.unicornCount <= 2) {
    if (card.cardClass === "downgrade" || ATTACK_CARDS.has(card.defId)) score += 18;
  }

  if (card.cardClass === "upgrade" && me.unicornCount < observation.winThreshold - 2) score += 3;
  if (definition.grantsExtraPlays) score += definition.grantsExtraPlays * 4;
  if (definition.grantsExtraDraws) score += definition.grantsExtraDraws * 3;
  return score;
}

function scoreDraw(observation: BotObservation): number {
  const me = player(observation, observation.botId)!;
  let score = observation.difficulty === "hard" ? 6 : 4;
  if (me.handCount <= 3) score += 3;
  if (observation.difficulty === "hard" && me.unicornCount >= 4) score += 1;
  return score;
}

function scoreDecisionOption(
  observation: BotObservation,
  decision: PendingDecision,
  option: string,
): number {
  if (decision.kind === "choosePlayer") {
    const candidate = player(observation, option);
    if (!candidate) return 0;
    if (decision.intent === "support") return candidate.id === observation.botId ? 100 : 0;
    if (decision.intent === "attack") {
      return candidate.id === observation.botId ? -100 : threatScore(observation, candidate);
    }
    return candidate.id === observation.botId ? -20 : threatScore(observation, candidate);
  }

  if (decision.kind === "chooseOption") {
    const label = decision.optionLabels?.[option]?.toLowerCase() ?? option.toLowerCase();
    if (label.includes("sacrifice") && label.includes("downgrade")) {
      return hasOwnedCardClass(observation, "downgrade") ? 10 : 1;
    }
    if (label.includes("destroy") || label.includes("steal")) return 8;
    return 0;
  }

  const card = observation.cards[option];
  if (!card) return 0;
  const value = cardValue(card);
  const owner = card.ownerId ? player(observation, card.ownerId) : undefined;
  const inferredIntent = decision.intent ?? inferIntent(observation, card);
  if (inferredIntent === "cost") return -value;
  if (inferredIntent === "gain" || inferredIntent === "support") return value;
  if (inferredIntent === "attack") {
    if (!owner || owner.id === observation.botId) return -100 - value;
    return value + threatScore(observation, owner);
  }
  return value;
}

function inferIntent(observation: BotObservation, card: ObservedCard): DecisionIntent {
  if (card.ownerId === observation.botId && (card.zone === "hand" || card.zone === "stable")) {
    return "cost";
  }
  if (card.ownerId && card.ownerId !== observation.botId && card.zone === "stable") return "attack";
  return "gain";
}

function chooseYesNo(observation: BotObservation, decision: PendingDecision): boolean {
  if (observation.difficulty === "easy") return true;
  const prompt = decision.prompt.toLowerCase();
  if (prompt.includes("draw an extra card")) return true;

  if (prompt.includes("claw machine")) {
    return observation.handIds.some((id) => {
      const card = observation.cards[id];
      return card && cardValue(card) <= 5;
    });
  }

  const leader = strongestOpponent(observation);
  const urgent = Boolean(leader && observation.winThreshold - leader.unicornCount <= 2);
  if (prompt.includes("immediately ends your turn")) return urgent;
  if (prompt.includes("destroy a unicorn")) return urgent || observation.difficulty === "medium";
  if (prompt.includes("discard 3 cards")) {
    return observation.difficulty === "medium" || urgent;
  }
  if (
    observation.difficulty === "hard" &&
    (prompt.includes("discard 2") || prompt.includes("sacrifice")) &&
    player(observation, observation.botId)!.handCount <= 2
  ) {
    return false;
  }
  return true;
}

function cardValue(card: ObservedCard): number {
  const definition = getDefinition(card.defId);
  let value =
    STRATEGIC_CARD_VALUE[card.defId] ??
    (
      { unicorn: 5, magic: 5, upgrade: 6, downgrade: 5, instant: 8 } satisfies Record<
        CardClass,
        number
      >
    )[card.cardClass];
  if (card.kind === "magical") value += 2;
  if (definition.unicornValue && definition.unicornValue > 1) value += 4;
  if (definition.aura) value += 2;
  if (definition.replacement?.length) value += 1;
  if (definition.grantsExtraPlays) value += definition.grantsExtraPlays * 3;
  if (definition.grantsExtraDraws) value += definition.grantsExtraDraws * 2;
  return value;
}

function threatScore(observation: BotObservation, candidate: ObservedPlayer): number {
  let score = candidate.unicornCount * 10 + candidate.handCount;
  if (observation.winThreshold - candidate.unicornCount <= 2) score += 35;
  for (const id of candidate.stableIds) {
    const card = observation.cards[id];
    if (card?.cardClass === "upgrade" || (card && STRATEGIC_CARD_VALUE[card.defId] >= 8)) {
      score += 3;
    }
  }
  return score;
}

function strongestOpponent(observation: BotObservation): ObservedPlayer | undefined {
  return observation.players
    .filter((candidate) => candidate.id !== observation.botId)
    .sort(
      (left, right) =>
        threatScore(observation, right) - threatScore(observation, left) ||
        left.id.localeCompare(right.id),
    )[0];
}

function player(observation: BotObservation, playerId: PlayerId): ObservedPlayer | undefined {
  return observation.players.find((candidate) => candidate.id === playerId);
}

function hasOwnedCardClass(observation: BotObservation, cardClass: CardClass): boolean {
  return player(observation, observation.botId)!.stableIds.some(
    (id) => observation.cards[id]?.cardClass === cardClass,
  );
}

function deterministicFraction(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}
