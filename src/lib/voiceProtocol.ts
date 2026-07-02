export interface VoiceIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface VoicePeerPresence {
  playerId: string;
  micEnabled: boolean;
}

export type VoiceDescription = {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
};

export interface VoiceCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export type VoiceSignal =
  | { type: "description"; description: VoiceDescription }
  | { type: "candidate"; candidate: VoiceCandidate };

export type VoiceServerEvent =
  | { type: "ready"; peers: VoicePeerPresence[]; iceServers: VoiceIceServer[] }
  | { type: "peer-joined"; peer: VoicePeerPresence }
  | { type: "peer-left"; playerId: string }
  | { type: "peer-state"; peer: VoicePeerPresence }
  | { type: "signal"; fromPlayerId: string; signal: VoiceSignal }
  | { type: "replaced" };

export type VoiceClientMessage =
  | {
      type: "signal";
      fromPlayerId: string;
      toPlayerId: string;
      signal: VoiceSignal;
    }
  | { type: "mic-state"; playerId: string; enabled: boolean };
