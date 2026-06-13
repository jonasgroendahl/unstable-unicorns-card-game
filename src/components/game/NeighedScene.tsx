import { useEffect } from "react";
import { Ban } from "lucide-react";
import { CardView } from "./CardView.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";
import { getCardPresentation } from "#/game/themes/cardPresentation.ts";
import type { CardView as CardViewData } from "#/game/view.ts";

export interface NeighedEvent {
  /** Sequence number of the `neighed` log event, used as a render key. */
  t: number;
  /** The card that was cancelled. */
  card: CardViewData;
  /** Whether the viewer is the player whose card got cancelled. */
  mine: boolean;
  /** Display name of the player whose card got cancelled. */
  ownerName: string;
}

const DISMISS_MS = 2600;

/**
 * Full-screen takeover shown the instant a played card is Neigh'd. Makes the
 * cancellation unmistakable — the log line alone was too easy to miss.
 */
export function NeighedScene({ event, onDismiss }: { event: NeighedEvent; onDismiss: () => void }) {
  const { themeId } = useGameTheme();
  const presentation = getCardPresentation(themeId, event.card);

  useEffect(() => {
    const id = setTimeout(onDismiss, DISMISS_MS);
    return () => clearTimeout(id);
  }, [event.t, onDismiss]);

  return (
    <div
      className="uu-neighed-scene fixed inset-0 z-[55] flex items-center justify-center px-4"
      role="alertdialog"
      aria-label={`${presentation.name} was Neigh'd`}
      onClick={onDismiss}
    >
      <div className="uu-neighed-stage relative flex flex-col items-center">
        <div className="uu-neighed-card relative">
          <CardView card={event.card} size="lg" previewOnly className="shadow-2xl" />
          <div className="uu-neighed-stamp" aria-hidden>
            <Ban className="size-6" />
            <span>Neigh&apos;d!</span>
          </div>
        </div>

        <div className="uu-neighed-copy mt-6 text-center" role="status" aria-live="assertive">
          <p className="uu-display text-2xl font-black text-amber-100 drop-shadow sm:text-3xl">
            {event.mine ? "Your card was Neigh'd!" : `${event.ownerName}'s card was Neigh'd!`}
          </p>
          <p className="mt-1 text-sm text-white/70">
            <strong className="text-white">{presentation.name}</strong> was cancelled
            {event.mine ? " before it could resolve." : "."}
          </p>
        </div>
      </div>
    </div>
  );
}
