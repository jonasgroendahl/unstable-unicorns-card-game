import { useEffect, useState } from "react";

/** Undefined until the client has mounted, then the saved seat id or null. */
export function useSessionSeatId(gameId: string): string | null | undefined {
  const [seatId, setSeatId] = useState<string | null>();

  useEffect(() => {
    setSeatId(sessionStorage.getItem(`uu.you.${gameId}`));
  }, [gameId]);

  return seatId;
}
