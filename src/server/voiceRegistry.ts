import type { VoiceServerEvent, VoiceSignal } from "#/lib/voiceProtocol.ts";
import { registry, type Lobby } from "./registry.ts";

type LobbyLookup = (gameId: string) => Promise<Lobby | undefined>;
type VoiceEventSender = (event: VoiceServerEvent) => void;

interface VoiceConnection {
  connectionId: string;
  micEnabled: boolean;
  send: VoiceEventSender;
}

export interface VoiceConnectionHandle {
  disconnect: () => void;
}

export class VoiceRegistry {
  private readonly rooms = new Map<string, Map<string, VoiceConnection>>();

  constructor(private readonly getLobby: LobbyLookup) {}

  async connect(
    gameId: string,
    playerId: string,
    connectionId: string,
    send: VoiceEventSender,
  ): Promise<VoiceConnectionHandle | null> {
    if (!(await this.isEligible(gameId, playerId))) return null;

    const room = this.rooms.get(gameId) ?? new Map<string, VoiceConnection>();
    this.rooms.set(gameId, room);

    const previous = room.get(playerId);
    const peers = [...room.entries()]
      .filter(([id]) => id !== playerId)
      .map(([id, connection]) => ({
        playerId: id,
        micEnabled: connection.micEnabled,
      }));

    if (previous) previous.send({ type: "replaced" });

    const connection: VoiceConnection = {
      connectionId,
      micEnabled: false,
      send,
    };
    room.set(playerId, connection);
    send({ type: "ready", peers, iceServers: [] });

    if (!previous) {
      this.broadcastExcept(gameId, playerId, {
        type: "peer-joined",
        peer: { playerId, micEnabled: false },
      });
    } else {
      this.broadcastExcept(gameId, playerId, {
        type: "peer-state",
        peer: { playerId, micEnabled: false },
      });
    }

    return {
      disconnect: () => {
        const currentRoom = this.rooms.get(gameId);
        const current = currentRoom?.get(playerId);
        if (!currentRoom || current?.connectionId !== connectionId) return;

        currentRoom.delete(playerId);
        if (currentRoom.size === 0) this.rooms.delete(gameId);
        else this.broadcastExcept(gameId, playerId, { type: "peer-left", playerId });
      },
    };
  }

  async isEligible(gameId: string, playerId: string): Promise<boolean> {
    const lobby = await this.getLobby(gameId);
    const seat = lobby?.seats.find((candidate) => candidate.id === playerId);
    return Boolean(seat && !seat.isBot);
  }

  relaySignal(
    gameId: string,
    fromPlayerId: string,
    toPlayerId: string,
    signal: VoiceSignal,
  ): boolean {
    const room = this.rooms.get(gameId);
    if (!room?.has(fromPlayerId)) return false;

    const target = room.get(toPlayerId);
    if (!target) return false;
    target.send({ type: "signal", fromPlayerId, signal });
    return true;
  }

  updateMicState(gameId: string, playerId: string, enabled: boolean): boolean {
    const connection = this.rooms.get(gameId)?.get(playerId);
    if (!connection) return false;

    connection.micEnabled = enabled;
    this.broadcastExcept(gameId, playerId, {
      type: "peer-state",
      peer: { playerId, micEnabled: enabled },
    });
    return true;
  }

  private broadcastExcept(gameId: string, excludedPlayerId: string, event: VoiceServerEvent) {
    for (const [playerId, connection] of this.rooms.get(gameId) ?? []) {
      if (playerId !== excludedPlayerId) connection.send(event);
    }
  }
}

const globalVoice = globalThis as unknown as { __uuVoiceRegistry?: VoiceRegistry };
export const voiceRegistry =
  globalVoice.__uuVoiceRegistry ?? new VoiceRegistry((gameId) => registry.getLobby(gameId));
globalVoice.__uuVoiceRegistry = voiceRegistry;
