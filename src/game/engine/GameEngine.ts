// The authoritative per-game engine.
//
// Holds the live GameState and runs all rules. Key design points (see plan):
//  - INITIATING commands (playCard/draw/endTurn) run through a serial promise
//    chain (mutex) so only one resolution is in flight at a time.
//  - RESOLVING inputs (decision answers, Neighs, passes) BYPASS the mutex and
//    settle the live deferred directly — otherwise the parked effect deadlocks.
//  - State is mutated in place but cloned at the start of each initiating command
//    so a thrown effect can roll back instead of wedging the game.

import { getDefinition } from "../cards";
import { makeInstanceId } from "../ids";
import { shuffle, seededFloat, nextSeed } from "../rng";
import { HAND_LIMIT, detach, playersInTurnOrderFrom as seatOrderFrom } from "../state";
import {
  canBeDestroyed,
  canBeSacrificed,
  canEnterStable,
  cardsCannotBeNeighd,
  canPlayNeigh,
  canPlayUpgrades,
  hasAura,
  isTargetableBy,
  isUnicorn,
  unicornCardCountFor,
  unicornCountFor,
  winThreshold,
} from "../derive";
import {
  REACTION_WINDOW_MS,
  type CardClass,
  type CardDefinition,
  type CardInstance,
  type ChooseInstanceOpts,
  type ChoosePlayerOpts,
  type EffectContext,
  type GameEvent,
  type GameState,
  type InstanceId,
  type PendingDecision,
  type PlayerId,
  type SelectionKind,
  type Zone,
} from "../types";
import { EndTurnSignal, makeDeferred, type Deferred } from "./signals";

type DecisionResolution = string | string[] | boolean | null;

export type EngineListener = (state: GameState) => void;

export class GameEngine {
  state: GameState;
  private commandChain: Promise<unknown> = Promise.resolve();
  private liveDecision: {
    decision: PendingDecision;
    deferred: Deferred<DecisionResolution>;
  } | null = null;
  private reactionDeferred: Deferred<{ byPlayer: PlayerId; instanceId: InstanceId } | null> | null =
    null;
  private reactionTimer: ReturnType<typeof setTimeout> | null = null;
  private logSeq = 0;
  private listeners = new Set<EngineListener>();
  /** Optional hook: when a bot owes the live decision/reaction, this is called. */
  onBotTurn?: (engine: GameEngine) => void;

  constructor(state: GameState) {
    this.state = state;
  }

  // --- pub/sub -------------------------------------------------------------
  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private broadcast() {
    for (const fn of this.listeners) fn(this.state);
    this.maybePromptBot();
  }

  private maybePromptBot() {
    if (!this.onBotTurn) return;
    // Defer so the current synchronous mutation settles first.
    queueMicrotask(() => this.onBotTurn?.(this));
  }

  // --- logging -------------------------------------------------------------
  private pushLog(message: string, extra?: Partial<GameEvent>, playerId?: PlayerId) {
    this.logSeq += 1;
    this.state.log.push({
      t: this.logSeq,
      kind: extra?.kind ?? "info",
      message,
      playerId,
      ...extra,
    });
    if (this.state.log.length > 200) this.state.log.shift();
  }

  // --- rng -----------------------------------------------------------------
  private randomInt(n: number): number {
    if (n <= 0) return 0;
    this.state.rngSeed = nextSeed(this.state.rngSeed);
    return Math.floor(seededFloat(this.state.rngSeed) * n);
  }

  // -------------------------------------------------------------------------
  // Public command surface
  // -------------------------------------------------------------------------

  /** Enqueue an initiating command behind the serial chain. */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.commandChain.then(fn);
    this.commandChain = run.catch(() => {});
    return run;
  }

  /** Submit an answer to the live decision (bypasses the command chain). */
  submitDecision(playerId: PlayerId, value: DecisionResolution): void {
    const live = this.liveDecision;
    if (!live) throw new EngineError("No decision is pending.");
    if (live.decision.playerId !== playerId) throw new EngineError("Not your decision.");
    if (!this.isLegalAnswer(live.decision, value)) throw new EngineError("Illegal answer.");
    const d = live.deferred;
    this.liveDecision = null;
    this.state.pendingDecisions.pop();
    d.resolve(value);
  }

  /** Play a Neigh into the open reaction window (bypasses the command chain). */
  submitReaction(playerId: PlayerId, instanceId: InstanceId | null): void {
    const def = this.reactionDeferred;
    const rx = this.state.reaction;
    if (!def || !rx) throw new EngineError("No reaction window is open.");
    if (instanceId === null) {
      // Pass.
      rx.awaitingFrom = rx.awaitingFrom.filter((p) => p !== playerId);
      if (rx.awaitingFrom.length === 0) {
        this.clearReactionTimer();
        def.resolve(null);
      } else {
        this.broadcast();
      }
      return;
    }
    // Playing a Neigh.
    const inst = this.state.instances[instanceId];
    if (!inst || inst.ownerId !== playerId || inst.zone !== "hand") {
      throw new EngineError("You don't hold that card.");
    }
    const cardDef = getDefinition(inst.defId);
    if (cardDef.cardClass !== "instant") throw new EngineError("That isn't a Neigh.");
    if (!rx.awaitingFrom.includes(playerId)) throw new EngineError("You can't react right now.");
    this.clearReactionTimer();
    def.resolve({ byPlayer: playerId, instanceId });
  }

  private isLegalAnswer(decision: PendingDecision, value: DecisionResolution): boolean {
    const [min, max] = decision.minMax ?? [1, 1];
    if (decision.kind === "yesNo") return typeof value === "boolean";
    if (value === null) return Boolean(decision.may);
    // Multi-select (e.g. "discard 3"): an array of option ids.
    if (Array.isArray(value)) {
      if (value.length < min || value.length > max) return false;
      const seen = new Set<string>();
      for (const v of value) {
        if (!decision.options.includes(v) || seen.has(v)) return false;
        seen.add(v);
      }
      return true;
    }
    // Single-select.
    if (typeof value !== "string") return false;
    return decision.options.includes(value);
  }

  // -------------------------------------------------------------------------
  // Deferred-based choice primitives
  // -------------------------------------------------------------------------

  private async ask(decision: Omit<PendingDecision, "id">): Promise<DecisionResolution> {
    // Safety: never park on a decision for a player who can't answer (e.g. a card
    // that sacrificed its own owner mid-effect). Auto-resolve instead of hanging.
    if (!decision.playerId || !this.state.players.some((p) => p.id === decision.playerId)) {
      this.pushLog("skipped a decision with no valid responder", { kind: "error" });
      return decision.kind === "yesNo" ? false : null;
    }
    const full: PendingDecision = { ...decision, id: makeInstanceId("d") };
    const deferred = makeDeferred<DecisionResolution>();
    this.state.pendingDecisions.push(full);
    this.liveDecision = { decision: full, deferred };
    this.broadcast();
    const result = await deferred.promise;
    return result;
  }

  // -------------------------------------------------------------------------
  // Context construction (handed to every effect)
  // -------------------------------------------------------------------------

  private makeContext(activePlayerId: PlayerId): EffectContext {
    // `self` lets the object-literal getter below close over the engine without
    // its own `this` shadowing it.
    // oxlint-disable-next-line no-this-alias
    const self = this;
    return {
      get state() {
        return self.state;
      },
      activePlayerId,
      def: (id) => getDefinition(self.state.instances[id].defId),
      instance: (id) => self.state.instances[id],
      log: (message, extra) => self.pushLog(message, extra, activePlayerId),
      playerName: (pid) => self.state.players.find((p) => p.id === pid)?.name ?? pid,
      playersInTurnOrderFrom: (pid) => seatOrderFrom(self.state, pid),
      isTargetable: (id, selection) =>
        isTargetableBy(self.state, self.state.instances[id], selection),
      randomInt: (n) => self.randomInt(n),
      relocateCard: (id, ownerId, zone) => self.relocateCard(id, ownerId, zone),
      takeToHand: (pid, id) => self.relocateCard(id, pid, "hand"),

      draw: (pid, n = 1) => self.draw(pid, n),
      discardChoice: (pid, n = 1, opts) => self.discardChoice(pid, n, opts),
      discardSpecific: (id) => self.discardSpecific(id),
      destroy: (id, opts) => self.destroy(id, opts),
      sacrifice: (id) => self.sacrifice(id),
      moveUnicornToStable: (id, ownerId, opts) => self.moveUnicornToStable(id, ownerId, opts),
      returnToHand: (id) => self.returnToHand(id),
      steal: (id, to) => self.steal(id, to),
      attachToStable: (id, ownerId) => self.relocateCard(id, ownerId, "stable"),

      chooseInstance: (pid, options, opts) => self.chooseInstance(pid, options, opts),
      chooseInstances: (pid, options, opts) => self.chooseInstances(pid, options, opts),
      choosePlayer: (pid, options, opts) => self.choosePlayer(pid, options, opts),
      chooseOption: (pid, options, opts) => self.chooseOption(pid, options, opts),
      yesNo: (pid, prompt) => self.yesNo(pid, prompt),

      endTurnNow: () => {
        throw new EndTurnSignal();
      },
      grantExtraTurn: (pid) => self.state.pendingTurns.push(pid),

      searchDeck: (pid, filter, opts) => self.searchDeck(pid, filter, opts),
      shuffleDeck: () => self.shuffleDeck(),
      shuffleDiscardIntoDeck: () => self.shuffleDiscardIntoDeck(),
    };
  }

  // --- choice helpers (resolve immediately when no legal option) -----------

  private async chooseInstance(
    playerId: PlayerId,
    options: InstanceId[],
    opts: ChooseInstanceOpts,
  ): Promise<InstanceId | null> {
    if (options.length === 0) return null;
    const res = await this.ask({
      playerId,
      kind: "chooseInstance",
      prompt: opts.prompt,
      options,
      minMax: opts.minMax ?? [1, 1],
      may: opts.may,
    });
    return typeof res === "string" ? res : null;
  }

  private async chooseInstances(
    playerId: PlayerId,
    options: InstanceId[],
    opts: ChooseInstanceOpts,
  ): Promise<InstanceId[]> {
    const [min] = opts.minMax ?? [1, 1];
    if (options.length < min) return [];
    const res = await this.ask({
      playerId,
      kind: "chooseInstance",
      prompt: opts.prompt,
      options,
      minMax: opts.minMax ?? [1, 1],
      may: opts.may,
    });
    if (Array.isArray(res)) return res;
    if (typeof res === "string") return [res];
    return [];
  }

  private async choosePlayer(
    playerId: PlayerId,
    options: PlayerId[],
    opts: ChoosePlayerOpts,
  ): Promise<PlayerId | null> {
    if (options.length === 0) return null;
    const res = await this.ask({
      playerId,
      kind: "choosePlayer",
      prompt: opts.prompt,
      options,
      may: opts.may,
      stablePreviewInstanceId: opts.stablePreviewInstanceId,
    });
    return typeof res === "string" ? res : null;
  }

  private async chooseOption(
    playerId: PlayerId,
    options: { key: string; label: string }[],
    opts: { may?: boolean; prompt: string },
  ): Promise<string | null> {
    if (options.length === 0) return null;
    const res = await this.ask({
      playerId,
      kind: "chooseOption",
      prompt: opts.prompt,
      options: options.map((o) => o.key),
      optionLabels: Object.fromEntries(options.map((o) => [o.key, o.label])),
      may: opts.may,
    });
    return typeof res === "string" ? res : null;
  }

  private async yesNo(playerId: PlayerId, prompt: string): Promise<boolean> {
    const res = await this.ask({ playerId, kind: "yesNo", prompt, options: [], may: true });
    return res === true;
  }

  // -------------------------------------------------------------------------
  // Raw zone movement (no triggers)
  // -------------------------------------------------------------------------

  private relocateCard(id: InstanceId, ownerId: PlayerId | null, zone: Zone): void {
    const inst = this.state.instances[id];
    detach(this.state, id);
    inst.zone = zone;
    inst.ownerId = ownerId;
    if (zone === "stable") inst.enteredTurn = this.state.turnNumber;
    const list = this.zoneFor(zone, ownerId);
    list.push(id);
  }

  private zoneFor(zone: Zone, ownerId: PlayerId | null): InstanceId[] {
    switch (zone) {
      case "deck":
        return this.state.deck;
      case "discard":
        return this.state.discard;
      case "nursery":
        return this.state.nursery;
      case "hand":
        return this.state.hands[ownerId!];
      case "stable":
        return this.state.stables[ownerId!];
    }
  }

  // -------------------------------------------------------------------------
  // Chokepoints
  // -------------------------------------------------------------------------

  private async fireTrigger(
    kind: "onEnterStable" | "beginningOfTurn" | "endOfTurn" | "onSacrificedOrDestroyed",
    inst: CardInstance,
  ): Promise<void> {
    const def = getDefinition(inst.defId);
    const effect = def.triggers?.[kind];
    if (!effect) return;
    // Blinding Light strips unicorn effects.
    if (
      inst.ownerId &&
      isUnicorn(this.state, inst) &&
      hasAura(this.state, inst.ownerId, "blindingLight")
    ) {
      return;
    }
    const ctx = this.makeContext(inst.ownerId ?? this.currentPlayerId());
    await effect(ctx, inst);
  }

  /** Barbed Wire: discard a card whenever a unicorn enters/leaves your stable. */
  private async barbedWireOn(ownerId: PlayerId | null): Promise<void> {
    if (!ownerId) return;
    if (!hasAura(this.state, ownerId, "barbedWire")) return;
    if ((this.state.hands[ownerId] ?? []).length === 0) return;
    this.pushLog("Barbed Wire forces a discard", { kind: "downgrade" }, ownerId);
    await this.discardChoice(ownerId, 1);
  }

  async moveUnicornToStable(
    id: InstanceId,
    ownerId: PlayerId,
    opts?: { from?: Zone },
  ): Promise<boolean> {
    const inst = this.state.instances[id];
    if (!canEnterStable(this.state, inst, ownerId)) {
      this.pushLog(`${getDefinition(inst.defId).name} can't enter that Stable (Queen Bee)`);
      return false;
    }
    this.relocateCard(id, ownerId, "stable");
    this.pushLog(`${getDefinition(inst.defId).name} entered ${this.nameOf(ownerId)}'s Stable`, {
      kind: "enter",
      instanceId: id,
    });
    await this.barbedWireOn(ownerId);
    await this.fireTrigger("onEnterStable", inst);
    void opts;
    return true;
  }

  private async removeFromStable(id: InstanceId): Promise<PlayerId | null> {
    const inst = this.state.instances[id];
    const owner = inst.ownerId;
    if (inst.zone === "stable" && isUnicorn(this.state, inst)) {
      await this.barbedWireOn(owner);
    }
    return owner;
  }

  /**
   * Destroy pipeline: prevention layers -> optional replacements -> leave+discard
   * -> on-death trigger. Returns whether the card actually left play.
   */
  async destroy(
    id: InstanceId,
    opts: { selection: SelectionKind; bySource?: CardClass },
  ): Promise<{ removed: boolean; prevented: boolean }> {
    const inst = this.state.instances[id];
    const def = getDefinition(inst.defId);

    // Layer 1: absolute prevention.
    if (!canBeDestroyed(this.state, inst, opts.bySource)) {
      this.pushLog(`${def.name} cannot be destroyed`, { kind: "prevent" });
      return { removed: false, prevented: true };
    }
    if (!isTargetableBy(this.state, inst, opts.selection)) {
      this.pushLog(`${def.name} is immune (Pandamonium)`, { kind: "prevent" });
      return { removed: false, prevented: true };
    }

    // Layer 2: optional replacements (asked of the card's owner).
    const replaced = await this.tryReplacement(inst, "destroy");
    if (replaced) return { removed: false, prevented: true };

    // Layer 3: the death.
    await this.commitDeath(inst);
    return { removed: true, prevented: false };
  }

  async sacrifice(id: InstanceId): Promise<{ removed: boolean; prevented: boolean }> {
    const inst = this.state.instances[id];
    const def = getDefinition(inst.defId);
    if (!canBeSacrificed(this.state, inst)) {
      this.pushLog(`${def.name} cannot be sacrificed`, { kind: "prevent" });
      return { removed: false, prevented: true };
    }
    const replaced = await this.tryReplacement(inst, "sacrifice");
    if (replaced) return { removed: false, prevented: true };
    await this.commitDeath(inst);
    return { removed: true, prevented: false };
  }

  /** Returns true if a replacement effect prevented the death. */
  private async tryReplacement(
    inst: CardInstance,
    cause: "destroy" | "sacrifice",
  ): Promise<boolean> {
    const def = getDefinition(inst.defId);
    const owner = inst.ownerId;
    const reps = def.replacement ?? [];

    // Baby return: babies never die — back to Nursery.
    if (reps.includes("babyReturn")) {
      await this.removeFromStable(inst.instanceId);
      this.relocateCard(inst.instanceId, null, "nursery");
      this.pushLog(`${def.name} returned to the Nursery`, { kind: "nursery" });
      return true;
    }

    // Return to hand (flying unicorns).
    if (reps.includes("returnToHand") && owner) {
      await this.removeFromStable(inst.instanceId);
      this.relocateCard(inst.instanceId, owner, "hand");
      this.pushLog(`${def.name} returned to ${this.nameOf(owner)}'s hand`, { kind: "return" });
      return true;
    }

    // Phoenix: discard a card instead (sacrifice OR destroy).
    if (reps.includes("phoenix") && owner && (this.state.hands[owner] ?? []).length > 0) {
      const use = await this.yesNo(owner, `${def.name}: discard a card instead of losing it?`);
      if (use) {
        await this.discardChoice(owner, 1);
        return true;
      }
    }

    // Black Knight: only on destroy, and only to save a DIFFERENT unicorn.
    if (cause === "destroy" && owner) {
      const blackKnight = (this.state.stables[owner] ?? [])
        .map((cid) => this.state.instances[cid])
        .find(
          (c) =>
            getDefinition(c.defId).replacement?.includes("blackKnight") &&
            c.instanceId !== inst.instanceId,
        );
      if (blackKnight && isUnicorn(this.state, inst)) {
        const use = await this.yesNo(owner, "Sacrifice Black Knight Unicorn to save your Unicorn?");
        if (use) {
          await this.sacrifice(blackKnight.instanceId);
          return true;
        }
      }
    }
    return false;
  }

  private async commitDeath(inst: CardInstance): Promise<void> {
    const def = getDefinition(inst.defId);
    await this.removeFromStable(inst.instanceId);
    this.relocateCard(inst.instanceId, null, "discard");
    this.pushLog(`${def.name} was sent to the discard pile`, {
      kind: "death",
      instanceId: inst.instanceId,
    });
    await this.fireTrigger("onSacrificedOrDestroyed", inst);
  }

  async returnToHand(id: InstanceId): Promise<void> {
    const inst = this.state.instances[id];
    const def = getDefinition(inst.defId);
    // Babies return to the Nursery instead.
    if (def.replacement?.includes("babyReturn")) {
      await this.removeFromStable(id);
      this.relocateCard(id, null, "nursery");
      this.pushLog(`${def.name} returned to the Nursery`, { kind: "nursery" });
      return;
    }
    const owner = inst.ownerId;
    await this.removeFromStable(id);
    this.relocateCard(id, owner, "hand");
    this.pushLog(`${def.name} returned to ${this.nameOf(owner)}'s hand`, { kind: "return" });
  }

  async steal(id: InstanceId, toPlayerId: PlayerId): Promise<boolean> {
    const inst = this.state.instances[id];
    if (isUnicorn(this.state, inst) && !canEnterStable(this.state, inst, toPlayerId)) return false;
    if (isUnicorn(this.state, inst)) await this.barbedWireOn(inst.ownerId);
    this.relocateCard(id, toPlayerId, "stable");
    this.pushLog(`${this.nameOf(toPlayerId)} stole ${getDefinition(inst.defId).name}`, {
      kind: "steal",
    });
    if (isUnicorn(this.state, inst)) await this.barbedWireOn(toPlayerId);
    return true;
  }

  async draw(playerId: PlayerId, n = 1): Promise<InstanceId[]> {
    const drawn: InstanceId[] = [];
    for (let i = 0; i < n; i++) {
      if (this.state.deck.length === 0) this.shuffleDiscardIntoDeck();
      const id = this.state.deck.pop();
      if (!id) break;
      this.relocateCard(id, playerId, "hand");
      drawn.push(id);
    }
    if (drawn.length)
      this.pushLog(
        `${this.nameOf(playerId)} drew ${drawn.length} card(s)`,
        { kind: "draw" },
        playerId,
      );
    return drawn;
  }

  async discardChoice(
    playerId: PlayerId,
    n = 1,
    opts?: { may?: boolean; filter?: (c: CardInstance) => boolean },
  ): Promise<InstanceId[]> {
    const hand = (this.state.hands[playerId] ?? []).filter((id) =>
      opts?.filter ? opts.filter(this.state.instances[id]) : true,
    );
    const count = Math.min(n, hand.length);
    if (count === 0) return [];
    const picks = await this.chooseInstances(playerId, hand, {
      prompt: count === 1 ? "Discard a card." : `Discard ${count} cards.`,
      minMax: [count, count],
      may: opts?.may,
    });
    for (const id of picks) await this.discardSpecific(id);
    return picks;
  }

  async discardSpecific(id: InstanceId): Promise<void> {
    const inst = this.state.instances[id];
    const def = getDefinition(inst.defId);
    if (def.replacement?.includes("babyReturn")) {
      this.relocateCard(id, null, "nursery");
      this.pushLog(`${def.name} returned to the Nursery`, { kind: "nursery" });
      return;
    }
    const wasStableUnicorn = inst.zone === "stable" && isUnicorn(this.state, inst);
    const owner = inst.ownerId;
    this.relocateCard(id, null, "discard");
    this.pushLog(`${def.name} was discarded`, { kind: "discard", instanceId: id });
    if (wasStableUnicorn) await this.barbedWireOn(owner);
  }

  // --- deck ops ------------------------------------------------------------
  shuffleDeck(): void {
    const res = shuffle(this.state.deck, this.state.rngSeed);
    this.state.deck = res.result;
    this.state.rngSeed = res.seed;
  }

  shuffleDiscardIntoDeck(): void {
    if (this.state.discard.length === 0) return;
    for (const id of this.state.discard.slice()) {
      const inst = this.state.instances[id];
      inst.zone = "deck";
      inst.ownerId = null;
    }
    this.state.deck.push(...this.state.discard);
    this.state.discard = [];
    this.shuffleDeck();
    this.pushLog("the discard pile was shuffled into the deck", { kind: "shuffle" });
  }

  async searchDeck(
    playerId: PlayerId,
    filter: (def: CardDefinition) => boolean,
    opts: { may?: boolean; prompt: string },
  ): Promise<InstanceId | null> {
    const matches = this.state.deck.filter((id) =>
      filter(getDefinition(this.state.instances[id].defId)),
    );
    if (matches.length === 0) {
      this.shuffleDeck();
      return null;
    }
    const pick = await this.chooseInstance(playerId, matches, {
      may: opts.may,
      prompt: opts.prompt,
    });
    if (pick) {
      this.relocateCard(pick, playerId, "hand");
      this.pushLog(`${this.nameOf(playerId)} searched the deck and took a card`, {
        kind: "search",
      });
    }
    this.shuffleDeck();
    return pick;
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------
  private nameOf(pid: PlayerId | null | undefined): string {
    if (!pid) return "—";
    return this.state.players.find((p) => p.id === pid)?.name ?? pid;
  }
  currentPlayerId(): PlayerId {
    return this.state.players[this.state.turnIndex].id;
  }

  private clearReactionTimer() {
    if (this.reactionTimer) {
      clearTimeout(this.reactionTimer);
      this.reactionTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // Reaction (Neigh) window — iterative chain resolver
  // -------------------------------------------------------------------------

  private eligibleNeighers(topByPlayer: PlayerId): PlayerId[] {
    // Yay: cards played by topByPlayer can't be Neigh'd at all.
    if (cardsCannotBeNeighd(this.state, topByPlayer)) return [];
    return this.state.players
      .filter((p) => p.id !== topByPlayer)
      .filter((p) => canPlayNeigh(this.state, p.id))
      .filter((p) =>
        (this.state.hands[p.id] ?? []).some(
          (id) => getDefinition(this.state.instances[id].defId).cardClass === "instant",
        ),
      )
      .map((p) => p.id);
  }

  /** Returns true if the originally-played card is cancelled by the Neigh chain. */
  private async resolveNeighChain(
    targetInstanceId: InstanceId,
    targetByPlayer: PlayerId,
  ): Promise<boolean> {
    const chain: { instanceId: InstanceId; byPlayer: PlayerId }[] = [];
    let topByPlayer = targetByPlayer;
    let topUnneighable = false;

    while (!topUnneighable) {
      const responders = this.eligibleNeighers(topByPlayer);
      if (responders.length === 0) break;

      const neigh = await this.openReactionWindow(
        targetInstanceId,
        targetByPlayer,
        chain,
        responders,
      );
      if (!neigh) break;

      chain.push(neigh);
      const ndef = getDefinition(this.state.instances[neigh.instanceId].defId);
      // Move the Neigh card to discard now (it's been played).
      this.relocateCard(neigh.instanceId, null, "discard");
      this.pushLog(`${this.nameOf(neigh.byPlayer)} played ${ndef.name}`, { kind: "neigh" });
      topByPlayer = neigh.byPlayer;
      topUnneighable = Boolean(ndef.unneighable);
    }

    this.state.reaction = null;
    this.reactionDeferred = null;
    this.broadcast();
    // Odd number of Neighs => original cancelled.
    return chain.length % 2 === 1;
  }

  private openReactionWindow(
    targetInstanceId: InstanceId,
    targetByPlayer: PlayerId,
    chain: { instanceId: InstanceId; byPlayer: PlayerId }[],
    responders: PlayerId[],
  ): Promise<{ byPlayer: PlayerId; instanceId: InstanceId } | null> {
    const deferred = makeDeferred<{ byPlayer: PlayerId; instanceId: InstanceId } | null>();
    this.reactionDeferred = deferred;
    this.state.reaction = {
      targetInstanceId,
      targetByPlayer,
      chain: chain.slice(),
      awaitingFrom: responders.slice(),
      closesAt: Date.now() + REACTION_WINDOW_MS,
    };
    this.clearReactionTimer();
    this.reactionTimer = setTimeout(() => deferred.resolve(null), REACTION_WINDOW_MS);
    this.broadcast();
    return deferred.promise;
  }

  // -------------------------------------------------------------------------
  // State-based actions (Tiny Stable + win), async loop with iteration cap
  // -------------------------------------------------------------------------

  private async checkStateBasedActions(): Promise<void> {
    let iterations = 0;
    for (;;) {
      if (++iterations > 100) {
        this.pushLog("state-based action loop halted", { kind: "error" });
        break;
      }
      // Tiny Stable: more than 5 unicorn CARDS => sacrifice down.
      const tooBig = this.state.players.find(
        (p) => hasAura(this.state, p.id, "tinyStable") && unicornCardCountFor(this.state, p.id) > 5,
      );
      if (tooBig) {
        const unicorns = (this.state.stables[tooBig.id] ?? []).filter((id) =>
          isUnicorn(this.state, this.state.instances[id]),
        );
        const pick = await this.chooseInstance(tooBig.id, unicorns, {
          prompt: "Tiny Stable: sacrifice a Unicorn (more than 5 in your Stable).",
        });
        if (pick) await this.sacrifice(pick);
        else break; // no sacrificeable unicorn — avoid infinite loop
        continue;
      }
      // Win check.
      const winner = this.state.players.find(
        (p) => unicornCountFor(this.state, p.id) >= winThreshold(this.state),
      );
      if (winner && this.state.status === "active") {
        this.state.status = "finished";
        this.state.winnerId = winner.id;
        this.pushLog(`${winner.name} wins the game!`, { kind: "win", playerId: winner.id });
      }
      break;
    }
  }

  // -------------------------------------------------------------------------
  // Turn flow
  // -------------------------------------------------------------------------

  /** Begin a player's turn: run beginning-of-turn triggers and set action economy. */
  async startTurn(): Promise<void> {
    return this.enqueue(async () => {
      await this.runBeginningPhase();
    });
  }

  private async runBeginningPhase(): Promise<void> {
    const pid = this.currentPlayerId();
    this.state.phase = "beginning";
    this.state.actionsRemaining = { plays: 1, draws: 0 };
    this.state.lastAutoDrawn = null;
    this.pushLog(`${this.nameOf(pid)}'s turn begins`, { kind: "turn", playerId: pid });
    this.broadcast();

    const snapshot = structuredClone(this.state);
    try {
      // Beginning-of-turn triggers from the player's stable cards.
      for (const id of (this.state.stables[pid] ?? []).slice()) {
        const inst = this.state.instances[id];
        if (inst.ownerId !== pid) continue; // moved away mid-resolution
        await this.fireTrigger("beginningOfTurn", inst);
      }
      // Extra plays from upgrades (Double Dutch).
      for (const id of this.state.stables[pid] ?? []) {
        const def = getDefinition(this.state.instances[id].defId);
        this.state.actionsRemaining.plays += def.grantsExtraPlays ?? 0;
      }
      await this.checkStateBasedActions();
      if (this.state.status !== "active") {
        this.broadcast();
        return;
      }
      // Draw phase: draw the mandatory card automatically.
      this.state.phase = "draw";
      const [drawn] = await this.draw(pid, 1);
      if (drawn) {
        this.state.lastAutoDrawn = {
          playerId: pid,
          instanceId: drawn,
          turnNumber: this.state.turnNumber,
        };
      }
    } catch (err) {
      if (err instanceof EndTurnSignal) {
        await this.finishTurn();
        return;
      }
      this.restore(snapshot);
      this.pushLog("error during beginning phase (rolled back)", { kind: "error" });
    }
    // Hand over to the player's action phase.
    this.state.phase = "action";
    this.broadcast();
  }

  /** Action: the active player plays a card from hand. */
  playCard(playerId: PlayerId, instanceId: InstanceId): Promise<void> {
    return this.enqueue(() => this.doPlayCard(playerId, instanceId));
  }

  private async doPlayCard(playerId: PlayerId, instanceId: InstanceId): Promise<void> {
    if (this.state.status !== "active") throw new EngineError("Game is not active.");
    if (playerId !== this.currentPlayerId()) throw new EngineError("Not your turn.");
    if (this.state.phase !== "action") {
      throw new EngineError("You can't play a card right now.");
    }
    if (this.state.actionsRemaining.plays <= 0) throw new EngineError("No plays remaining.");

    const inst = this.state.instances[instanceId];
    if (!inst || inst.ownerId !== playerId || inst.zone !== "hand") {
      throw new EngineError("You don't hold that card.");
    }
    const def = getDefinition(inst.defId);
    if (def.cardClass === "instant") throw new EngineError("Neighs are only played in reaction.");
    if (def.cardClass === "upgrade" && !canPlayUpgrades(this.state, playerId)) {
      throw new EngineError("You can't play Upgrades (Broken Stable).");
    }

    const ctx = this.makeContext(playerId);
    if (def.canPlay && !def.canPlay(ctx, inst)) {
      throw new EngineError(`${def.name} has no legal target right now.`);
    }

    const snapshot = structuredClone(this.state);
    this.state.actionsRemaining.plays -= 1;
    this.pushLog(`${this.nameOf(playerId)} plays ${def.name}`, {
      kind: "play",
      playerId,
      instanceId,
    });

    // Open the Neigh reaction window before the effect resolves.
    const cancelled = await this.resolveNeighChain(instanceId, playerId);
    if (cancelled) {
      // Card is countered: send it to discard, do not apply effect.
      if (this.state.instances[instanceId].zone === "hand") {
        this.relocateCard(instanceId, null, "discard");
      }
      this.pushLog(`${def.name} was Neigh'd`, { kind: "neighed" });
      await this.checkStateBasedActions();
      await this.afterAction();
      return;
    }

    try {
      await this.applyPlayedCard(inst, playerId);
      await this.checkStateBasedActions();
    } catch (err) {
      if (err instanceof EndTurnSignal) {
        await this.checkStateBasedActions();
        await this.finishTurn();
        return;
      }
      this.restore(snapshot);
      this.pushLog(`error resolving ${def.name} (rolled back)`, { kind: "error" });
    }
    await this.afterAction();
  }

  private async applyPlayedCard(inst: CardInstance, playerId: PlayerId): Promise<void> {
    const def = getDefinition(inst.defId);
    switch (def.cardClass) {
      case "unicorn":
        // Move from hand into the stable (fires onEnter, Barbed Wire, etc.).
        await this.moveUnicornToStable(inst.instanceId, playerId, { from: "hand" });
        break;
      case "upgrade":
      case "downgrade": {
        // Choose which stable to attach to (downgrades typically target opponents).
        const ctx = this.makeContext(playerId);
        const options = this.state.players.map((p) => p.id);
        const target = await ctx.choosePlayer(playerId, options, {
          prompt:
            def.cardClass === "downgrade"
              ? "Attach this Downgrade to which player's Stable?"
              : "Attach this Upgrade to which player's Stable?",
          stablePreviewInstanceId: inst.instanceId,
        });
        const dest = target ?? playerId;
        this.relocateCard(inst.instanceId, dest, "stable");
        this.pushLog(`${def.name} attached to ${this.nameOf(dest)}'s Stable`, { kind: "attach" });
        break;
      }
      case "magic": {
        const ctx = this.makeContext(playerId);
        if (def.play) await def.play(ctx, inst);
        // Magic cards go to discard after resolving (if not already moved).
        if (this.state.instances[inst.instanceId].zone === "hand") {
          this.relocateCard(inst.instanceId, null, "discard");
        }
        break;
      }
      case "instant":
        break;
    }
  }

  private async afterAction(): Promise<void> {
    if (this.state.status !== "active") {
      this.broadcast();
      return;
    }
    // If the player has used up all their plays, auto-advance to end of turn.
    if (this.state.actionsRemaining.plays <= 0) {
      await this.finishTurn();
      return;
    }
    this.broadcast();
  }

  /** Action alternative: draw a card instead of playing, then end the turn. */
  drawForTurn(playerId: PlayerId): Promise<void> {
    return this.enqueue(async () => {
      if (playerId !== this.currentPlayerId()) throw new EngineError("Not your turn.");
      if (this.state.phase !== "action") throw new EngineError("You can't draw right now.");
      await this.draw(playerId, 1);
      await this.checkStateBasedActions();
      // Drawing is the player's action for the turn — end it.
      await this.finishTurn();
    });
  }

  endTurn(playerId: PlayerId): Promise<void> {
    return this.enqueue(async () => {
      if (playerId !== this.currentPlayerId()) throw new EngineError("Not your turn.");
      await this.finishTurn();
    });
  }

  private async finishTurn(): Promise<void> {
    if (this.state.status !== "active") return;
    const pid = this.currentPlayerId();
    this.state.phase = "end";
    this.broadcast();

    // End-of-turn triggers (Puppicorn move, Lasso return).
    for (const id of (this.state.stables[pid] ?? []).slice()) {
      const inst = this.state.instances[id];
      if (inst.ownerId !== pid) continue;
      try {
        await this.fireTrigger("endOfTurn", inst);
      } catch (err) {
        if (!(err instanceof EndTurnSignal)) throw err;
      }
    }

    // Discard down to the hand limit.
    const over = (this.state.hands[pid] ?? []).length - HAND_LIMIT;
    if (over > 0) {
      await this.discardChoice(pid, over);
    }

    await this.checkStateBasedActions();
    if (this.state.status !== "active") {
      this.broadcast();
      return;
    }

    this.advanceTurn();
    await this.runBeginningPhase();
  }

  private advanceTurn(): void {
    // Honor queued extra turns (Change of Luck) before advancing seating.
    const extra = this.state.pendingTurns.shift();
    if (extra) {
      this.state.turnIndex = this.state.players.findIndex((p) => p.id === extra);
    } else {
      this.state.turnIndex = (this.state.turnIndex + 1) % this.state.players.length;
    }
    this.state.turnNumber += 1;
  }

  private restore(snapshot: GameState): void {
    this.state.instances = snapshot.instances;
    this.state.deck = snapshot.deck;
    this.state.discard = snapshot.discard;
    this.state.nursery = snapshot.nursery;
    this.state.hands = snapshot.hands;
    this.state.stables = snapshot.stables;
    this.state.actionsRemaining = snapshot.actionsRemaining;
    this.state.phase = snapshot.phase;
    this.state.pendingDecisions = [];
    this.state.reaction = null;
    this.liveDecision = null;
    this.reactionDeferred = null;
    this.state.rngSeed = snapshot.rngSeed;
  }
}

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}
