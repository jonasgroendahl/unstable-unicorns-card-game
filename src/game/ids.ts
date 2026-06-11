// Deterministic instance-id generation. Ids are sequential within a game so that
// a game replays identically from a seed + command log (no crypto randomness).

let globalCounter = 0;

/** Monotonic counter-based id. Prefix keeps ids human-scannable in logs. */
export function makeInstanceId(prefix = "c"): string {
  globalCounter += 1;
  return `${prefix}${globalCounter.toString(36)}`;
}

/** Short uppercase join code for lobbies, e.g. "QК4F". */
export function makeJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function makeGameId(): string {
  return `g${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
