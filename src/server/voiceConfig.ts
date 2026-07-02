import { z } from "zod";
import type { VoiceIceServer } from "#/lib/voiceProtocol.ts";

export const DEFAULT_VOICE_ICE_SERVERS: VoiceIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

const iceServerSchema = z.object({
  urls: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  username: z.string().optional(),
  credential: z.string().optional(),
});

export function parseVoiceIceServers(raw = process.env.VOICE_ICE_SERVERS_JSON): VoiceIceServer[] {
  if (!raw) return DEFAULT_VOICE_ICE_SERVERS;

  try {
    return z.array(iceServerSchema).min(1).parse(JSON.parse(raw));
  } catch (error) {
    console.warn("VOICE_ICE_SERVERS_JSON is invalid; using the default public STUN server.", error);
    return DEFAULT_VOICE_ICE_SERVERS;
  }
}
