// Test harness: drives a GameEngine deterministically by auto-answering pending
// decisions and reactions from scripted policies. Lets tests assert end states
// without a UI or network.

import { GameEngine } from "./GameEngine";
import { createInitialState, type SeatConfig } from "../state";
import { getDefinition } from "../cards";
import type { GameState, InstanceId, PendingDecision, PlayerId } from "../types";

export type DecisionPolicy = (
  decision: PendingDecision,
  state: GameState,
) => string | string[] | boolean | null;

export type ReactionPolicy = (playerId: PlayerId, state: GameState) => InstanceId | null;

export interface HarnessOptions {
  seats?: SeatConfig[];
  seed?: number;
  /** Default decision policy (first option / yes). */
  decide?: DecisionPolicy;
  /** Default reaction policy (always pass). */
  react?: ReactionPolicy;
}

const DEFAULT_SEATS: SeatConfig[] = [
  { id: "p1", name: "Alice", isBot: false },
  { id: "p2", name: "Bob", isBot: false },
];

export class Harness {
  engine: GameEngine;
  private decide: DecisionPolicy;
  private react: ReactionPolicy;

  constructor(opts: HarnessOptions = {}) {
    const seats = opts.seats ?? DEFAULT_SEATS;
    const state = createInitialState(seats, opts.seed ?? 12345, "test-game");
    this.engine = new GameEngine(state);
    this.decide = opts.decide ?? ((d) => firstAnswer(d));
    this.react = opts.react ?? (() => null);

    // Auto-respond to any decision/reaction the engine surfaces.
    this.engine.subscribe(() => this.drain());
    this.engine.onBotTurn = undefined; // tests drive turns explicitly
  }

  get state(): GameState {
    return this.engine.state;
  }

  /** Settle any outstanding decision/reaction using the policies. */
  private drain() {
    queueMicrotask(() => {
      const s = this.engine.state;
      const decision = s.pendingDecisions[s.pendingDecisions.length - 1];
      if (decision) {
        const answer = this.decide(decision, s);
        try {
          this.engine.submitDecision(decision.playerId, answer);
        } catch {
          /* race */
        }
        return;
      }
      if (s.reaction) {
        for (const pid of s.reaction.awaitingFrom) {
          const card = this.react(pid, s);
          try {
            this.engine.submitReaction(pid, card);
          } catch {
            /* race */
          }
          return;
        }
      }
    });
  }

  async start() {
    await this.engine.startTurn();
    await this.settle();
  }

  /** Let microtasks flush so all parked effects resolve. */
  async settle() {
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 0));
      const s = this.engine.state;
      if (!s.pendingDecisions.length && !s.reaction) break;
    }
  }

  async play(playerId: PlayerId, instanceId: InstanceId) {
    await this.engine.playCard(playerId, instanceId);
    await this.settle();
  }

  async drawTurn(playerId: PlayerId) {
    await this.engine.drawForTurn(playerId);
    await this.settle();
  }

  async endTurn(playerId: PlayerId) {
    await this.engine.endTurn(playerId);
    await this.settle();
  }

  // --- helpers for tests ---------------------------------------------------

  setDecide(policy: DecisionPolicy) {
    this.decide = policy;
  }
  setReact(policy: ReactionPolicy) {
    this.react = policy;
  }

  /** Pull a free instance of a slug from the deck (or any hand) for scenario setup. */
  private takeFree(slug: string): InstanceId {
    const s = this.engine.state;
    let id = s.deck.find((i) => getDefinition(s.instances[i].defId).id === slug);
    if (id) {
      s.deck.splice(s.deck.indexOf(id), 1);
      return id;
    }
    // Fall back to any hand (single-copy cards may already be dealt).
    for (const pid of Object.keys(s.hands)) {
      id = s.hands[pid].find((i) => getDefinition(s.instances[i].defId).id === slug);
      if (id) {
        s.hands[pid].splice(s.hands[pid].indexOf(id), 1);
        return id;
      }
    }
    throw new Error(`No free ${slug} available`);
  }

  /** Force a card into a player's hand (for setting up scenarios). */
  giveCard(playerId: PlayerId, slug: string): InstanceId {
    const id = this.takeFree(slug);
    const inst = this.engine.state.instances[id];
    inst.zone = "hand";
    inst.ownerId = playerId;
    this.engine.state.hands[playerId].push(id);
    return id;
  }

  /** Force a card directly into a player's stable. */
  giveStable(playerId: PlayerId, slug: string): InstanceId {
    const id = this.takeFree(slug);
    const inst = this.engine.state.instances[id];
    inst.zone = "stable";
    inst.ownerId = playerId;
    this.engine.state.stables[playerId].push(id);
    return id;
  }

  stableSlugs(playerId: PlayerId): string[] {
    return this.engine.state.stables[playerId].map(
      (id) => getDefinition(this.engine.state.instances[id].defId).id,
    );
  }

  handSlugs(playerId: PlayerId): string[] {
    return this.engine.state.hands[playerId].map(
      (id) => getDefinition(this.engine.state.instances[id].defId).id,
    );
  }
}

function firstAnswer(d: PendingDecision): string | string[] | boolean | null {
  if (d.kind === "yesNo") return true;
  const [min] = d.minMax ?? [1, 1];
  if (d.options.length === 0) return null;
  if (min > 1) return d.options.slice(0, min);
  return d.options[0];
}
