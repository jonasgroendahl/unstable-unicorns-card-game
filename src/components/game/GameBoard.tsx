import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { CardBack, CardView } from "./CardView.tsx";
import { PlayerStable } from "./PlayerStable.tsx";
import { HandFan } from "./HandFan.tsx";
import { ReactionPrompt } from "./ReactionPrompt.tsx";
import { DecisionOverlay, WaitingBanner } from "./DecisionOverlay.tsx";
import { GameLog } from "./GameLog.tsx";
import { AudioControl } from "./AudioControl.tsx";
import { WinScreen } from "./WinScreen.tsx";
import { audio } from "#/lib/audio.ts";
import type { GameView, CardView as CardViewData } from "#/game/view.ts";
import type { Answer } from "#/lib/gameClient.ts";

export interface BoardActions {
  playCard: (instanceId: string) => Promise<string | void>;
  drawForTurn: () => Promise<string | void>;
  endTurn: () => Promise<string | void>;
  resolveDecision: (value: Answer) => void;
  playReaction: (instanceId: string | null) => void;
}

interface GameBoardProps {
  view: GameView;
  actions: BoardActions;
  /** Debug: switch the active viewpoint among seats. */
  seatSwitcher?: React.ReactNode;
}

export function GameBoard({ view, actions, seatSwitcher }: GameBoardProps) {
  const me = view.players.find((p) => p.id === view.viewerId)!;
  const opponents = view.players.filter((p) => p.id !== view.viewerId);
  const isMyTurn = view.currentPlayerId === view.viewerId;
  const playName = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;

  // Inline targeting: a chooseInstance decision whose options are board cards.
  const decision = view.decision;
  const boardTargetIds = useMemo(() => {
    if (!decision || decision.kind !== "chooseInstance") return null;
    const inStable = new Set<string>();
    for (const p of view.players) for (const c of p.stable) inStable.add(c.instanceId);
    const opts = decision.options.filter((id) => inStable.has(id));
    // Only treat as inline if ALL options are stable cards (not hand/discard).
    if (opts.length === decision.options.length && opts.length > 0) return new Set(opts);
    return null;
  }, [decision, view.players]);
  const stableChoicePlayerIds = useMemo(() => {
    if (decision?.kind !== "choosePlayer" || !decision.stablePreviewCard) return null;
    return new Set(decision.options);
  }, [decision]);

  const [selectedMulti] = useState<Set<string>>(new Set());

  // Unlock audio + start (optional) background music on first user gesture.
  useEffect(() => {
    const kick = () => {
      audio.unlock();
      audio.startMusic();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);

  // Toast errors from rejected moves; announce turn changes.
  const toastErr = (p: Promise<string | void>) => void p.then((err) => err && toast.error(err));
  const lastTurnRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastTurnRef.current && lastTurnRef.current !== view.currentPlayerId) {
      const name = playName(view.currentPlayerId);
      toast(view.currentPlayerId === view.viewerId ? "Your turn!" : `${name}'s turn`, {
        duration: 1600,
      });
    }
    lastTurnRef.current = view.currentPlayerId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.currentPlayerId]);

  const onBoardCardClick = (card: CardViewData) => {
    if (boardTargetIds?.has(card.instanceId)) {
      audio.play("click");
      actions.resolveDecision(card.instanceId);
    }
  };
  const onStableClick = (playerId: string) => {
    if (!stableChoicePlayerIds?.has(playerId)) return;
    audio.play("click");
    actions.resolveDecision(playerId);
  };

  // Responsive opponent layout: spread along the top, scaling with count.
  const oppCols =
    opponents.length <= 2
      ? opponents.length
      : opponents.length <= 4
        ? 2
        : opponents.length <= 6
          ? 3
          : 4;

  return (
    <div className="uu-root uu-starfield relative flex h-dvh flex-col overflow-hidden">
      {/* top bar */}
      <header className="relative z-20 flex items-center gap-3 px-3 py-2">
        <span className="uu-display text-lg font-bold text-amber-200">
          <Sparkles className="mb-0.5 mr-1 inline size-4" />
          Unstable Unicorns
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
          Turn {view.turnNumber} · {playName(view.currentPlayerId)}
          {isMyTurn ? " (you)" : ""}
        </span>
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-100">
          <Trophy className="mb-0.5 mr-1 inline size-3" />
          Goal: {view.winThreshold} unicorns
        </span>
        <div className="ml-auto flex items-center gap-2">
          {seatSwitcher}
          <AudioControl />
        </div>
      </header>

      {/* opponents */}
      <div
        className="relative z-10 grid justify-center gap-2 px-3 py-1"
        style={{ gridTemplateColumns: `repeat(${oppCols}, minmax(0, 1fr))`, maxWidth: "100%" }}
      >
        {opponents.map((p) => (
          <PlayerStable
            key={p.id}
            player={p}
            winThreshold={view.winThreshold}
            cardSize="xs"
            compact
            targetableIds={boardTargetIds ?? undefined}
            onCardClick={onBoardCardClick}
            stableTargetable={stableChoicePlayerIds?.has(p.id)}
            stablePreviewCard={decision?.stablePreviewCard}
            onStableClick={onStableClick}
          />
        ))}
      </div>

      {/* center: deck / discard / nursery */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-3">
        <div className="flex items-end gap-4">
          <Pile label="Deck" count={view.deckCount}>
            <CardBack size="md" count={view.deckCount} />
          </Pile>
          <Pile label="Discard" count={view.discardCount}>
            {view.discardTop ? <CardView card={view.discardTop} size="md" /> : <EmptyPile />}
          </Pile>
          <Pile label="Nursery" count={view.nurseryCount}>
            <div className="uu-card uu-cardback w-24 aspect-[5/7]">
              <Sparkles className="size-5 text-pink-200/70" />
            </div>
          </Pile>
        </div>

        <aside className="absolute inset-y-0 right-3 hidden w-72 items-center lg:flex">
          <GameLog log={view.log} />
        </aside>
      </div>

      {/* viewer stable + hand */}
      <footer className="relative z-10 px-3 pb-2">
        <div className="mb-2 flex items-end justify-center gap-3">
          <div className="flex-1 max-w-[640px]">
            <PlayerStable
              player={me}
              winThreshold={view.winThreshold}
              cardSize="sm"
              targetableIds={boardTargetIds ?? undefined}
              selectedIds={selectedMulti}
              onCardClick={onBoardCardClick}
              isViewer
              stableTargetable={stableChoicePlayerIds?.has(me.id)}
              stablePreviewCard={decision?.stablePreviewCard}
              onStableClick={onStableClick}
            />
          </div>
          {/* turn actions */}
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              disabled={!isMyTurn || view.phase !== "action" || !!decision || !!view.reaction}
              onClick={() => {
                audio.play("draw");
                toastErr(actions.drawForTurn());
              }}
            >
              <Layers className="size-4" /> Draw & end
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!isMyTurn || !!decision || !!view.reaction}
              onClick={() => toastErr(actions.endTurn())}
            >
              End turn
            </Button>
          </div>
        </div>

        <HandFan
          cards={me.hand ?? []}
          autoDrawnCardId={view.autoDrawnCardId}
          canPlay={isMyTurn && view.phase === "action" && !decision && !view.reaction}
          isPlayable={(c) => c.cardClass !== "instant"}
          reasonFor={(c) =>
            c.cardClass === "instant"
              ? "Neighs are played in reaction, not on your turn"
              : undefined
          }
          onPlay={(c) => {
            audio.play("play");
            toastErr(actions.playCard(c.instanceId));
          }}
        />
      </footer>

      {/* overlays */}
      {view.reaction && (
        <ReactionPrompt
          reaction={view.reaction}
          playerName={playName}
          onNeigh={(id) => {
            audio.play("neigh");
            actions.playReaction(id);
          }}
          onPass={() => actions.playReaction(null)}
        />
      )}

      {decision && (
        <DecisionOverlay
          decision={decision}
          playerName={playName}
          inlineTargets={!!boardTargetIds}
          inlinePlayerTargets={!!stableChoicePlayerIds}
          onAnswer={(v) => actions.resolveDecision(v)}
        />
      )}
      {!decision && view.someoneDeciding && (
        <WaitingBanner
          name={playName(view.someoneDeciding.playerId)}
          prompt={view.someoneDeciding.prompt}
        />
      )}

      {view.status === "finished" && (
        <WinScreen
          winnerName={view.winnerId ? playName(view.winnerId) : "Nobody"}
          youWon={view.winnerId === view.viewerId}
        />
      )}
    </div>
  );
}

function Pile({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="text-[10px] uppercase tracking-wide text-white/50">
        {label} · {count}
      </span>
    </div>
  );
}

function EmptyPile() {
  return (
    <div className="grid w-24 aspect-[5/7] place-items-center rounded-xl border border-dashed border-white/15 text-white/30">
      empty
    </div>
  );
}
