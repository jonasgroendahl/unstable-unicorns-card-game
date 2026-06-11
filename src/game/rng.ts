// Seeded PRNG (mulberry32) so games are fully reproducible from (seed, command log).
// The seed lives in GameState and is advanced by every random operation.

export function nextSeed(seed: number): number {
  // Advance the 32-bit state once.
  return (seed + 0x6d2b79f5) | 0;
}

/** Returns a float in [0, 1) for the given seed (does not advance). */
export function seededFloat(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Fisher–Yates shuffle using the seed; returns the shuffled array and the
 * advanced seed. Pure — does not mutate the input.
 */
export function shuffle<T>(items: readonly T[], seed: number): { result: T[]; seed: number } {
  const result = items.slice();
  let s = seed | 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = nextSeed(s);
    const j = Math.floor(seededFloat(s) * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return { result, seed: s };
}

/** Derive a non-deterministic starting seed (used when creating a new game). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) | 0 || 1;
}
