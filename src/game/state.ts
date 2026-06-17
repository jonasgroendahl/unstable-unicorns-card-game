// Game state construction and pure zone helpers.

import { definitionsForDeck, type DeckId } from "./decks";
import { makeInstanceId } from "./ids";
import { shuffle } from "./rng";
import type { CardInstance, GamePlayer, GameState, InstanceId, PlayerId, Zone } from "./types";

const STARTING_HAND = 5;
export const HAND_LIMIT = 7;

export interface SeatConfig {
  id: PlayerId;
  name: string;
  isBot: boolean;
}

/**
 * Build the full deck of card instances (every copy of every non-baby card) plus
 * the Nursery of Baby Unicorns. Babies are NOT shuffled into the deck.
 */
function buildCards(
  deckId: DeckId,
  playerCount: number,
): { deck: CardInstance[]; babies: CardInstance[] } {
  const deck: CardInstance[] = [];
  const babies: CardInstance[] = [];
  for (const def of definitionsForDeck(deckId, playerCount)) {
    for (let i = 0; i < def.copies; i++) {
      const inst: CardInstance = {
        instanceId: makeInstanceId(),
        defId: def.id,
        zone: def.kind === "baby" ? "nursery" : "deck",
        ownerId: null,
      };
      if (def.kind === "baby") babies.push(inst);
      else deck.push(inst);
    }
  }
  return { deck, babies };
}

export function createInitialState(
  seats: SeatConfig[],
  seed: number,
  gameId: string,
  deckId: DeckId,
): GameState {
  if (seats.length < 2 || seats.length > 8) {
    throw new Error(`Unstable Unicorns supports 2–8 players, got ${seats.length}`);
  }

  const players: GamePlayer[] = seats.map((s) => ({
    id: s.id,
    name: s.name,
    isBot: s.isBot,
    connected: true,
  }));

  const { deck, babies } = buildCards(deckId, seats.length);
  const instances: Record<InstanceId, CardInstance> = {};
  for (const c of [...deck, ...babies]) instances[c.instanceId] = c;

  // Shuffle the Nursery and the deck with the seeded rng.
  const babyShuffle = shuffle(
    babies.map((b) => b.instanceId),
    seed,
  );
  const deckShuffle = shuffle(
    deck.map((d) => d.instanceId),
    babyShuffle.seed,
  );
  let rngSeed = deckShuffle.seed;

  const state: GameState = {
    gameId,
    deckId,
    rngSeed,
    players,
    instances,
    deck: deckShuffle.result,
    discard: [],
    nursery: babyShuffle.result,
    resolving: [],
    hands: Object.fromEntries(players.map((p) => [p.id, []])),
    stables: Object.fromEntries(players.map((p) => [p.id, []])),
    turnIndex: 0,
    turnNumber: 1,
    pendingTurns: [],
    phase: "beginning",
    actionsRemaining: { plays: 1, draws: 0 },
    playedThisTurn: false,
    lastAutoDrawn: null,
    pendingDecisions: [],
    reaction: null,
    status: "active",
    log: [],
  };

  // Each player starts with one Baby Unicorn in their stable.
  for (const p of players) {
    const babyId = state.nursery.pop();
    if (!babyId) throw new Error("Not enough Baby Unicorns for all players");
    const inst = instances[babyId];
    inst.zone = "stable";
    inst.ownerId = p.id;
    inst.enteredTurn = 0;
    state.stables[p.id].push(babyId);
  }

  // 2-player variant: before dealing, hand each player a guaranteed Neigh so
  // both start with one in hand (total of 6 cards once the 5 below are dealt).
  // https://www.unstablegameswiki.com/index.php?title=Unstable_Unicorns_-_Two_Player_Rules
  if (players.length === 2) {
    for (const p of players) {
      const neighIdx = state.deck.findIndex((id) => instances[id].defId === "neigh");
      if (neighIdx < 0) break;
      const [id] = state.deck.splice(neighIdx, 1);
      const inst = instances[id];
      inst.zone = "hand";
      inst.ownerId = p.id;
      state.hands[p.id].push(id);
    }
  }

  // Deal opening hands.
  for (let i = 0; i < STARTING_HAND; i++) {
    for (const p of players) {
      const id = state.deck.pop();
      if (!id) break;
      const inst = instances[id];
      inst.zone = "hand";
      inst.ownerId = p.id;
      state.hands[p.id].push(id);
    }
  }

  return state;
}

// --- pure helpers ----------------------------------------------------------

export function zoneList(state: GameState, zone: Zone, ownerId?: PlayerId): InstanceId[] {
  switch (zone) {
    case "deck":
      return state.deck;
    case "discard":
      return state.discard;
    case "nursery":
      return state.nursery;
    case "resolving":
      return (state.resolving ??= []);
    case "hand":
      return state.hands[ownerId!];
    case "stable":
      return state.stables[ownerId!];
  }
}

/** Remove an instance id from whatever zone list currently holds it. */
export function detach(state: GameState, instanceId: InstanceId): void {
  const inst = state.instances[instanceId];
  const list = zoneList(state, inst.zone, inst.ownerId ?? undefined);
  const idx = list.indexOf(instanceId);
  if (idx >= 0) list.splice(idx, 1);
}

export function currentPlayer(state: GameState): GamePlayer {
  return state.players[state.turnIndex];
}

export function playerById(state: GameState, id: PlayerId): GamePlayer | undefined {
  return state.players.find((p) => p.id === id);
}

/** Player ids starting from `from`, going clockwise (seating order). */
export function playersInTurnOrderFrom(state: GameState, from: PlayerId): PlayerId[] {
  const ids = state.players.map((p) => p.id);
  const start = ids.indexOf(from);
  if (start < 0) return ids;
  return [...ids.slice(start), ...ids.slice(0, start)];
}
