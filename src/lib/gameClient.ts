// Unified game client used by the board UI. Two implementations behind one
// interface so the same components work for local hotseat/debug and networked
// multiplayer:
//   LocalGameClient  — drives an in-process GameEngine (no network); /debug.
//   RemoteGameClient — SSE for state push + server functions for commands.

import { GameEngine } from "../game/engine/GameEngine";
import { runBots } from "../game/ai/bot";
import { createGame } from "../game/index";
import { sanitizeFor, type GameView } from "../game/view";
import type { InstanceId, PlayerId } from "../game/types";
import type { SeatConfig } from "../game/state";
import type { DeckId, ExpansionId } from "../game/decks";
import {
  drawForTurn as rpcDraw,
  endTurn as rpcEndTurn,
  playCard as rpcPlay,
  playReaction as rpcReaction,
  resolveDecision as rpcResolve,
} from "../server/actions";

export type Answer = string | string[] | boolean | null;

export interface GameClient {
  /** Subscribe to view updates for the given viewer; returns unsubscribe. */
  subscribe(viewerId: PlayerId, fn: (view: GameView) => void): () => void;
  /** Returns an error message if the move was rejected, else void. */
  playCard(playerId: PlayerId, instanceId: InstanceId): Promise<string | void>;
  drawForTurn(playerId: PlayerId): Promise<string | void>;
  endTurn(playerId: PlayerId): Promise<string | void>;
  resolveDecision(playerId: PlayerId, value: Answer): Promise<void>;
  playReaction(playerId: PlayerId, instanceId: InstanceId | null): Promise<void>;
  dispose(): void;
}

// --- Local (in-process) client -------------------------------------------

export class LocalGameClient implements GameClient {
  engine: GameEngine;
  private viewers = new Map<PlayerId, Set<(v: GameView) => void>>();

  constructor(seats: SeatConfig[], seed?: number, deckId?: DeckId, expansionIds?: ExpansionId[]) {
    this.engine = createGame({ gameId: "local", seats, seed, deckId, expansionIds });
    this.engine.subscribe(() => this.emit());
    this.emit();
  }

  private emit() {
    for (const [viewerId, fns] of this.viewers) {
      const view = sanitizeFor(this.engine.state, viewerId);
      for (const fn of fns) fn(view);
    }
  }

  subscribe(viewerId: PlayerId, fn: (view: GameView) => void): () => void {
    if (!this.viewers.has(viewerId)) this.viewers.set(viewerId, new Set());
    this.viewers.get(viewerId)!.add(fn);
    // Immediate snapshot.
    fn(sanitizeFor(this.engine.state, viewerId));
    return () => this.viewers.get(viewerId)?.delete(fn);
  }

  async playCard(playerId: PlayerId, instanceId: InstanceId): Promise<string | void> {
    let err: string | undefined;
    await this.engine.playCard(playerId, instanceId).catch((e) => (err = (e as Error).message));
    runBots(this.engine);
    return err;
  }
  async drawForTurn(playerId: PlayerId): Promise<string | void> {
    let err: string | undefined;
    await this.engine.drawForTurn(playerId).catch((e) => (err = (e as Error).message));
    runBots(this.engine);
    return err;
  }
  async endTurn(playerId: PlayerId): Promise<string | void> {
    let err: string | undefined;
    await this.engine.endTurn(playerId).catch((e) => (err = (e as Error).message));
    runBots(this.engine);
    return err;
  }
  async resolveDecision(playerId: PlayerId, value: Answer) {
    try {
      this.engine.submitDecision(playerId, value);
    } catch {
      /* ignore */
    }
    runBots(this.engine);
  }
  async playReaction(playerId: PlayerId, instanceId: InstanceId | null) {
    try {
      this.engine.submitReaction(playerId, instanceId);
    } catch {
      /* ignore */
    }
    runBots(this.engine);
  }
  dispose() {
    this.viewers.clear();
  }
}

// --- Remote (SSE + server fn) client -------------------------------------

export class RemoteGameClient implements GameClient {
  private gameId: string;
  private sources = new Map<PlayerId, EventSource>();
  private latest = new Map<PlayerId, GameView>();
  private viewers = new Map<PlayerId, Set<(v: GameView) => void>>();

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  subscribe(viewerId: PlayerId, fn: (view: GameView) => void): () => void {
    if (!this.viewers.has(viewerId)) this.viewers.set(viewerId, new Set());
    this.viewers.get(viewerId)!.add(fn);
    const cached = this.latest.get(viewerId);
    if (cached) fn(cached);

    if (!this.sources.has(viewerId)) {
      const es = new EventSource(
        `/api/stream/${this.gameId}?playerId=${encodeURIComponent(viewerId)}`,
      );
      es.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "state") {
            this.latest.set(viewerId, msg.view);
            for (const f of this.viewers.get(viewerId) ?? []) f(msg.view);
          }
        } catch {
          /* ignore */
        }
      };
      this.sources.set(viewerId, es);
    }
    return () => this.viewers.get(viewerId)?.delete(fn);
  }

  async playCard(playerId: PlayerId, instanceId: InstanceId): Promise<string | void> {
    const r = await rpcPlay({ data: { gameId: this.gameId, playerId, instanceId } });
    if (r && !r.ok) return r.error;
  }
  async drawForTurn(playerId: PlayerId): Promise<string | void> {
    const r = await rpcDraw({ data: { gameId: this.gameId, playerId } });
    if (r && !r.ok) return r.error;
  }
  async endTurn(playerId: PlayerId): Promise<string | void> {
    const r = await rpcEndTurn({ data: { gameId: this.gameId, playerId } });
    if (r && !r.ok) return r.error;
  }
  async resolveDecision(playerId: PlayerId, value: Answer) {
    await rpcResolve({ data: { gameId: this.gameId, playerId, value } });
  }
  async playReaction(playerId: PlayerId, instanceId: InstanceId | null) {
    await rpcReaction({ data: { gameId: this.gameId, playerId, instanceId } });
  }
  dispose() {
    for (const es of this.sources.values()) es.close();
    this.sources.clear();
    this.viewers.clear();
  }
}
