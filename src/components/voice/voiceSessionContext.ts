import { createContext, useContext } from "react";
import type { VoicePeerPresence } from "#/lib/voiceProtocol.ts";

export type VoiceConnectionStatus =
  | "inactive"
  | "connecting"
  | "ready"
  | "unsupported"
  | "replaced";
export type VoiceMicState = "off" | "requesting" | "on" | "denied" | "error" | "unavailable";

export interface VoicePeerState extends VoicePeerPresence {
  muted: boolean;
}

export interface VoiceSessionValue {
  connectionStatus: VoiceConnectionStatus;
  micState: VoiceMicState;
  micError: string | null;
  peers: Record<string, VoicePeerState>;
  playbackBlocked: boolean;
  toggleMicrophone: () => Promise<void>;
  togglePeerMuted: (playerId: string) => void;
  enablePlayback: () => Promise<void>;
  /** Live local microphone track, or null when the mic is off. Used to tap audio levels. */
  getLocalAudioTrack: () => MediaStreamTrack | null;
}

const EMPTY_VOICE_SESSION: VoiceSessionValue = {
  connectionStatus: "inactive",
  micState: "off",
  micError: null,
  peers: {},
  playbackBlocked: false,
  toggleMicrophone: async () => {},
  togglePeerMuted: () => {},
  enablePlayback: async () => {},
  getLocalAudioTrack: () => null,
};

export const VoiceSessionContext = createContext<VoiceSessionValue>(EMPTY_VOICE_SESSION);

export function useVoiceSession() {
  return useContext(VoiceSessionContext);
}
