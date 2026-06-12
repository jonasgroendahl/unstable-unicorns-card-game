import { useEffect, useMemo, useRef, useState } from "react";
import { Hand, Layers, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
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
  const [inspectedOpponentId, setInspectedOpponentId] = useState<string | null>(null);
  const inspectedOpponent = opponents.find((player) => player.id === inspectedOpponentId);
  const stableDialogTitleRef = useRef<HTMLHeadingElement>(null);

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

  const opponentStables = (mobile: boolean, inspectable = false) =>
    opponents.map((p) => (
      <PlayerStable
        key={p.id}
        player={p}
        winThreshold={view.winThreshold}
        cardSize={mobile ? "sm" : "xs"}
        compact={!mobile}
        scrollCards={mobile || inspectable}
        targetableIds={boardTargetIds ?? undefined}
        onCardClick={onBoardCardClick}
        stableTargetable={stableChoicePlayerIds?.has(p.id)}
        stablePreviewCard={decision?.stablePreviewCard}
        onStableClick={onStableClick}
        onInspect={inspectable ? () => setInspectedOpponentId(p.id) : undefined}
      />
    ));

  const viewerStable = (mobile: boolean) => (
    <PlayerStable
      player={me}
      winThreshold={view.winThreshold}
      cardSize="sm"
      scrollCards={mobile}
      targetableIds={boardTargetIds ?? undefined}
      selectedIds={selectedMulti}
      onCardClick={onBoardCardClick}
      isViewer
      stableTargetable={stableChoicePlayerIds?.has(me.id)}
      stablePreviewCard={decision?.stablePreviewCard}
      onStableClick={onStableClick}
    />
  );

  const piles = (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
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
  );

  const drawDisabled = !isMyTurn || view.phase !== "action" || !!decision || !!view.reaction;
  const endDisabled = !isMyTurn || !!decision || !!view.reaction;
  const turnActions = (mobile: boolean) => (
    <div className={mobile ? "grid grid-cols-2 gap-2" : "flex flex-col gap-1.5"}>
      <Button
        size={mobile ? "default" : "sm"}
        disabled={drawDisabled}
        onClick={() => {
          audio.play("draw");
          toastErr(actions.drawForTurn());
        }}
      >
        <Layers data-icon="inline-start" /> Draw & end
      </Button>
      <Button
        size={mobile ? "default" : "sm"}
        variant="secondary"
        disabled={endDisabled}
        onClick={() => toastErr(actions.endTurn())}
      >
        End turn
      </Button>
    </div>
  );

  return (
    <div className="uu-root uu-starfield relative flex h-dvh flex-col overflow-hidden">
      {/* top bar */}
      <header className="uu-game-header relative z-20 flex shrink-0 items-center gap-2 px-3 py-2">
        <span className="uu-display hidden text-lg font-bold text-amber-200 sm:inline">
          <Sparkles className="mb-0.5 mr-1 inline size-4" />
          Unstable Unicorns
        </span>
        <span className="uu-display text-sm font-bold text-amber-200 sm:hidden">
          <Sparkles className="mr-1 inline size-3.5" />
          UU
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] sm:py-0.5 sm:text-xs">
          Turn {view.turnNumber} · {playName(view.currentPlayerId)}
          {isMyTurn ? " · you" : ""}
        </span>
        <span className="hidden rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-100 sm:inline">
          <Trophy className="mb-0.5 mr-1 inline size-3" />
          Goal: {view.winThreshold} unicorns
        </span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 text-[10px] font-bold text-amber-100 sm:hidden">
          <Trophy className="size-3" />
          {me.unicornCount}/{view.winThreshold}
          <Hand className="ml-1 size-3" />
          {me.handCount}
        </span>
        <div className="flex items-center gap-2 sm:ml-auto">
          {seatSwitcher}
          <AudioControl className="hidden sm:flex" />
          <AudioControl compact className="sm:hidden" />
        </div>
      </header>

      {/* mobile table: every public zone stays inspectable while the hand remains docked */}
      <main
        className="uu-mobile-table relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:hidden"
        aria-label="Game table"
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
            <Users className="size-3.5" />
            Opponent stables
          </span>
          <span className="text-[10px] text-white/40">Swipe to inspect</span>
        </div>
        <div className="uu-opponents-rail" role="region" aria-label="Opponent stables">
          {opponentStables(true)}
        </div>

        <section className="py-5" aria-label="Card piles">
          {piles}
        </section>

        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
          Your stable
        </div>
        {viewerStable(true)}

        <div className="mt-3">
          <GameLog log={view.log} />
        </div>
      </main>

      {/* desktop opponents: one compact row keeps the hand in view */}
      <section
        className="relative z-10 hidden shrink-0 px-3 pb-1 pt-1 sm:block"
        aria-label="Opponent stables"
      >
        <div className="mb-1 flex items-center justify-between gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-white/55">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            Opponent stables
          </span>
          <span className="font-medium normal-case tracking-normal text-white/40">
            Scroll cards or open a stable to inspect
          </span>
        </div>
        <div className="uu-desktop-opponents-rail">{opponentStables(false, true)}</div>
      </section>

      {/* desktop center: deck / discard / nursery */}
      <div className="relative z-10 hidden flex-1 items-center justify-center px-3 sm:flex">
        {piles}

        <aside className="absolute inset-y-0 right-3 hidden w-72 items-center lg:flex">
          <GameLog log={view.log} />
        </aside>
      </div>

      {/* viewer stable + hand */}
      <footer className="uu-game-footer relative z-20 shrink-0 px-3 pb-2">
        <div className="mb-2 hidden items-end justify-center gap-3 sm:flex">
          <div className="flex-1 max-w-[640px]">{viewerStable(false)}</div>
          {turnActions(false)}
        </div>

        <div className="mb-1.5 sm:hidden">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-white/50">
            <span>
              {isMyTurn
                ? `Your ${view.phase} phase`
                : `Waiting for ${playName(view.currentPlayerId)}`}
            </span>
            <span>
              {view.actionsRemaining.plays} play · {view.actionsRemaining.draws} draw
            </span>
          </div>
          {turnActions(true)}
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
      <Dialog
        open={Boolean(inspectedOpponent)}
        onOpenChange={(open) => !open && setInspectedOpponentId(null)}
      >
        <DialogContent
          className="uu-stable-dialog max-h-[min(90dvh,52rem)] max-w-[min(72rem,calc(100vw-2rem))] overflow-y-auto border-white/15 bg-[#160d2c]/95 p-4 text-white sm:max-w-[min(72rem,calc(100vw-2rem))]"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            stableDialogTitleRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle
              ref={stableDialogTitleRef}
              tabIndex={-1}
              className="uu-display text-amber-100 outline-none"
            >
              {inspectedOpponent?.name ?? "Opponent"}&apos;s stable
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Full stable view. Select highlighted cards here or close to return to the table.
            </DialogDescription>
          </DialogHeader>
          {inspectedOpponent && (
            <PlayerStable
              player={inspectedOpponent}
              winThreshold={view.winThreshold}
              cardSize="md"
              targetableIds={boardTargetIds ?? undefined}
              onCardClick={(card) => {
                onBoardCardClick(card);
                if (boardTargetIds?.has(card.instanceId)) setInspectedOpponentId(null);
              }}
              stableTargetable={stableChoicePlayerIds?.has(inspectedOpponent.id)}
              stablePreviewCard={decision?.stablePreviewCard}
              onStableClick={(playerId) => {
                onStableClick(playerId);
                if (stableChoicePlayerIds?.has(playerId)) setInspectedOpponentId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
