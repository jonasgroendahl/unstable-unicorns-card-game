import { useEffect, useRef, useState } from "react";
import type { GameClient } from "./gameClient";
import type { GameView } from "../game/view";
import type { PlayerId } from "../game/types";
import { audio } from "./audio";

/** Subscribe to a client's view for a viewer; plays SFX on notable transitions. */
export function useGameView(client: GameClient | null, viewerId: PlayerId): GameView | null {
  const [view, setView] = useState<GameView | null>(null);
  const prev = useRef<GameView | null>(null);

  useEffect(() => {
    if (!client) return;
    const unsub = client.subscribe(viewerId, (v) => {
      playTransitionSounds(prev.current, v, viewerId);
      prev.current = v;
      setView(v);
    });
    return () => {
      unsub();
    };
  }, [client, viewerId]);

  return view;
}

function playTransitionSounds(prev: GameView | null, next: GameView, viewerId: PlayerId) {
  if (!prev) return;

  // Reaction window just opened.
  if (!prev.reaction && next.reaction) audio.play("neigh");
  // A decision now owed by the viewer.
  if (!prev.decision && next.decision) audio.play("turn");
  // Turn changed to the viewer.
  if (prev.currentPlayerId !== next.currentPlayerId && next.currentPlayerId === viewerId) {
    audio.play("turn");
  }

  // Read newly-appended log events for precise per-event SFX. The log is a
  // bounded sliding window, so match on the highest sequence number we've seen.
  const lastSeen = prev.log.length ? prev.log[prev.log.length - 1].t : 0;
  let played = false;
  for (const e of next.log) {
    if (e.t <= lastSeen) continue;
    switch (e.kind) {
      case "death":
      case "destroy":
        audio.play("destroy");
        played = true;
        break;
      case "discard":
        if (!played) audio.play("sacrifice");
        break;
      case "steal":
        audio.play("steal");
        played = true;
        break;
      case "draw":
        if (!played) audio.play("draw");
        break;
      case "neigh":
        audio.play("neigh");
        played = true;
        break;
      case "neighed":
        audio.play("neighed");
        played = true;
        break;
    }
  }
  // Fallback: a card hit the discard with no specific event matched.
  if (!played && next.discardCount > prev.discardCount) audio.play("play");

  // Win / loss.
  if (next.status === "finished" && prev.status !== "finished") {
    audio.play(next.winnerId === viewerId ? "win" : "lose");
  }
}
