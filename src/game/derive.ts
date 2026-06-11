// Effective-identity selector layer (plan pitfall #3).
//
// Auras and downgrades rewrite what a card *is* or *can do*. Every chokepoint and
// state-based check must go through these selectors instead of reading raw card
// fields, so Pandamonium / Blinding Light / Ginormous / Queen Bee / Rainbow Aura
// are honored consistently everywhere.
//
// Layer order: prevention (Rainbow Aura) > type-rewrite (Pandamonium/Blinding
// Light) > counting (Ginormous).

import { getDefinition } from "./cards";
import type {
  AuraKind,
  CardClass,
  CardInstance,
  GameState,
  PlayerId,
  SelectionKind,
} from "./types";

export function defOf(_state: GameState, inst: CardInstance) {
  return getDefinition(inst.defId);
}

export function isUnicorn(state: GameState, inst: CardInstance): boolean {
  return defOf(state, inst).cardClass === "unicorn";
}

/** Auras currently active in a player's stable. */
export function activeAuras(state: GameState, playerId: PlayerId): Set<AuraKind> {
  const auras = new Set<AuraKind>();
  for (const id of state.stables[playerId] ?? []) {
    const aura = defOf(state, state.instances[id]).aura;
    if (aura) auras.add(aura);
  }
  return auras;
}

export function hasAura(state: GameState, playerId: PlayerId, aura: AuraKind): boolean {
  for (const id of state.stables[playerId] ?? []) {
    if (defOf(state, state.instances[id]).aura === aura) return true;
  }
  return false;
}

/**
 * Whether a unicorn's own triggered/aura effects function. Blinding Light strips
 * effects from all the controller's unicorns (treated as Basic with no effects).
 */
export function cardHasEffects(state: GameState, inst: CardInstance): boolean {
  if (inst.ownerId && hasAura(state, inst.ownerId, "blindingLight")) {
    // Blinding Light only affects Unicorn cards.
    if (isUnicorn(state, inst)) return false;
  }
  return true;
}

/**
 * Can `inst` be selected as the victim of an effect using the given selection
 * kind? Pandamonium makes the controller's unicorns ("Pandas") immune to effects
 * that TARGET a unicorn, but not to mass / self-selected effects.
 */
export function isTargetableBy(
  state: GameState,
  inst: CardInstance,
  selection: SelectionKind,
): boolean {
  if (selection === "targeted" && inst.ownerId && isUnicorn(state, inst)) {
    if (hasAura(state, inst.ownerId, "pandamonium")) return false;
  }
  return true;
}

/** Can this unicorn be destroyed right now (Rainbow Aura / Kittencorn / Puppicorn)? */
export function canBeDestroyed(
  state: GameState,
  inst: CardInstance,
  bySource: CardClass | undefined,
): boolean {
  const def = defOf(state, inst);
  if (def.cantBeSacrificedOrDestroyed) return false;
  if (def.cantBeDestroyedByMagic && bySource === "magic") return false;
  if (inst.ownerId && isUnicorn(state, inst) && hasAura(state, inst.ownerId, "rainbowAura")) {
    return false;
  }
  return true;
}

export function canBeSacrificed(state: GameState, inst: CardInstance): boolean {
  return !defOf(state, inst).cantBeSacrificedOrDestroyed;
}

/** Unicorn value of a single card (Ginormous = 2, everything else 1). */
export function unicornValueOf(state: GameState, inst: CardInstance): number {
  if (!isUnicorn(state, inst)) return 0;
  return defOf(state, inst).unicornValue ?? 1;
}

/** Total unicorns in a player's stable (counts Babies; Ginormous as 2). */
export function unicornCountFor(state: GameState, playerId: PlayerId): number {
  let n = 0;
  for (const id of state.stables[playerId] ?? []) {
    n += unicornValueOf(state, state.instances[id]);
  }
  return n;
}

/** Raw number of unicorn cards (used by Tiny Stable's "more than 5" check). */
export function unicornCardCountFor(state: GameState, playerId: PlayerId): number {
  let n = 0;
  for (const id of state.stables[playerId] ?? []) {
    if (isUnicorn(state, state.instances[id])) n += 1;
  }
  return n;
}

/** Number of unicorns required to win, by player count. */
export function winThreshold(state: GameState): number {
  return state.players.length >= 6 ? 6 : 7;
}

/** Queen Bee: Basic Unicorns can only enter the Queen Bee owner's stable. */
export function canEnterStable(state: GameState, inst: CardInstance, ownerId: PlayerId): boolean {
  const def = defOf(state, inst);
  if (def.kind === "basic" || def.kind === "baby") {
    // Find any Queen Bee in play.
    for (const pid of state.players.map((p) => p.id)) {
      if (hasAura(state, pid, "queenBee") && pid !== ownerId) {
        return false;
      }
    }
  }
  return true;
}

/** Slowdown / Ginormous prevent a player from playing Neigh cards. */
export function canPlayNeigh(state: GameState, playerId: PlayerId): boolean {
  return !hasAura(state, playerId, "slowdown") && !hasAura(state, playerId, "ginormous");
}

/** Broken Stable prevents playing Upgrade cards. */
export function canPlayUpgrades(state: GameState, playerId: PlayerId): boolean {
  return !hasAura(state, playerId, "brokenStable");
}

/** Yay: cards this player plays cannot be Neigh'd. */
export function cardsCannotBeNeighd(state: GameState, playerId: PlayerId): boolean {
  return hasAura(state, playerId, "yay");
}

/** Is a player's hand public (Nanny Cam)? */
export function handIsPublic(state: GameState, playerId: PlayerId): boolean {
  return hasAura(state, playerId, "nannyCam");
}

export function hasBasicUnicornInStable(state: GameState, playerId: PlayerId): boolean {
  for (const id of state.stables[playerId] ?? []) {
    if (defOf(state, state.instances[id]).kind === "basic") return true;
  }
  return false;
}
