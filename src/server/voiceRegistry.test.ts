import { expect, it } from "vitest";
import type { VoiceServerEvent } from "#/lib/voiceProtocol.ts";
import type { Lobby } from "./registry.ts";
import { DEFAULT_VOICE_ICE_SERVERS, parseVoiceIceServers } from "./voiceConfig.ts";
import { VoiceRegistry } from "./voiceRegistry.ts";

function lobby(gameId: string): Lobby {
  return {
    gameId,
    joinCode: "VOICE1",
    hostId: "alice",
    status: "lobby",
    deckId: "base-first-edition",
    expansionIds: [],
    createdAt: 1,
    seats: [
      { id: "alice", name: "Alice", isBot: false, connected: true },
      { id: "bob", name: "Bob", isBot: false, connected: true },
      { id: "bot", name: "Bot", isBot: true, connected: true },
    ],
  };
}

function setup() {
  const lobbies = new Map([
    ["game-a", lobby("game-a")],
    ["game-b", lobby("game-b")],
  ]);
  return new VoiceRegistry(async (gameId) => lobbies.get(gameId));
}

it("allows seated humans and rejects bots or unknown players", async () => {
  const registry = setup();

  expect(await registry.isEligible("game-a", "alice")).toBe(true);
  expect(await registry.isEligible("game-a", "bot")).toBe(false);
  expect(await registry.isEligible("game-a", "unknown")).toBe(false);
  expect(await registry.connect("game-a", "bot", "bot-1", () => {})).toBeNull();
});

it("announces presence, relays signals, broadcasts mic state, and cleans up", async () => {
  const registry = setup();
  const aliceEvents: VoiceServerEvent[] = [];
  const bobEvents: VoiceServerEvent[] = [];
  const alice = await registry.connect("game-a", "alice", "alice-1", (event) =>
    aliceEvents.push(event),
  );
  const bob = await registry.connect("game-a", "bob", "bob-1", (event) => bobEvents.push(event));

  expect(aliceEvents).toContainEqual({
    type: "peer-joined",
    peer: { playerId: "bob", micEnabled: false },
  });
  expect(bobEvents[0]).toMatchObject({
    type: "ready",
    peers: [{ playerId: "alice", micEnabled: false }],
  });

  const signal = {
    type: "candidate" as const,
    candidate: { candidate: "candidate:voice" },
  };
  expect(registry.relaySignal("game-a", "alice", "bob", signal)).toBe(true);
  expect(bobEvents).toContainEqual({ type: "signal", fromPlayerId: "alice", signal });

  expect(registry.updateMicState("game-a", "bob", true)).toBe(true);
  expect(aliceEvents).toContainEqual({
    type: "peer-state",
    peer: { playerId: "bob", micEnabled: true },
  });

  bob?.disconnect();
  expect(aliceEvents).toContainEqual({ type: "peer-left", playerId: "bob" });
  expect(registry.relaySignal("game-a", "alice", "bob", signal)).toBe(false);
  alice?.disconnect();
});

it("replaces a duplicate player connection without letting stale cleanup remove the new one", async () => {
  const registry = setup();
  const firstEvents: VoiceServerEvent[] = [];
  const secondEvents: VoiceServerEvent[] = [];
  const first = await registry.connect("game-a", "alice", "alice-old", (event) =>
    firstEvents.push(event),
  );
  const second = await registry.connect("game-a", "alice", "alice-new", (event) =>
    secondEvents.push(event),
  );

  expect(firstEvents).toContainEqual({ type: "replaced" });
  first?.disconnect();
  expect(registry.updateMicState("game-a", "alice", true)).toBe(true);
  expect(secondEvents[0]).toMatchObject({ type: "ready" });
  second?.disconnect();
});

it("does not relay signals across game rooms", async () => {
  const registry = setup();
  await registry.connect("game-a", "alice", "alice-a", () => {});
  await registry.connect("game-b", "bob", "bob-b", () => {});

  expect(
    registry.relaySignal("game-a", "alice", "bob", {
      type: "candidate",
      candidate: { candidate: "candidate:cross-room" },
    }),
  ).toBe(false);
});

it("parses configured ICE servers and safely falls back for invalid configuration", () => {
  expect(
    parseVoiceIceServers(
      JSON.stringify([
        { urls: ["stun:stun.example.com"], username: "voice", credential: "secret" },
      ]),
    ),
  ).toEqual([{ urls: ["stun:stun.example.com"], username: "voice", credential: "secret" }]);

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    expect(parseVoiceIceServers("not-json")).toEqual(DEFAULT_VOICE_ICE_SERVERS);
  } finally {
    console.warn = originalWarn;
  }
});
