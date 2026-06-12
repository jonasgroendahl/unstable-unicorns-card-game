import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { CardView } from "./CardView.tsx";
import { cn } from "#/lib/utils.ts";
import type { DecisionView } from "#/game/view.ts";
import type { Answer } from "#/lib/gameClient.ts";

interface DecisionOverlayProps {
  decision: DecisionView;
  playerName: (id: string) => string;
  /** True when the decision targets board cards that are highlighted in place. */
  inlineTargets?: boolean;
  /** True when the decision is answered by clicking a highlighted player Stable. */
  inlinePlayerTargets?: boolean;
  onAnswer: (value: Answer) => void;
}

/**
 * Renders the pending decision. For chooseInstance decisions whose options are
 * cards on the board (stables), the board itself highlights targets and this
 * overlay shows just the prompt; for hand/discard picks it shows the cards.
 */
export function DecisionOverlay({
  decision,
  playerName,
  inlineTargets,
  inlinePlayerTargets,
  onAnswer,
}: DecisionOverlayProps) {
  const [min, max] = decision.minMax ?? [1, 1];
  const multi = max > 1;
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [decision.id]);

  if (decision.kind === "yesNo") {
    return (
      <Banner prompt={decision.prompt}>
        <div className="flex justify-center gap-3">
          <Button onClick={() => onAnswer(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Check className="size-4" /> Yes
          </Button>
          <Button variant="secondary" onClick={() => onAnswer(false)}>
            <X className="size-4" /> No
          </Button>
        </div>
      </Banner>
    );
  }

  if (decision.kind === "choosePlayer") {
    if (inlinePlayerTargets) {
      return (
        <Banner
          prompt={decision.prompt}
          subtitle="Tap a highlighted Stable to attach it. On larger screens, hover to preview."
          centered
        >
          {decision.may && (
            <Button variant="ghost" onClick={() => onAnswer(null)}>
              Decline
            </Button>
          )}
        </Banner>
      );
    }

    return (
      <Banner prompt={decision.prompt}>
        <div className="flex flex-wrap justify-center gap-2">
          {decision.options.map((pid) => (
            <Button key={pid} variant="outline" onClick={() => onAnswer(pid)}>
              {playerName(pid)}
            </Button>
          ))}
          {decision.may && (
            <Button variant="ghost" onClick={() => onAnswer(null)}>
              Decline
            </Button>
          )}
        </div>
      </Banner>
    );
  }

  if (decision.kind === "chooseOption") {
    return (
      <Banner prompt={decision.prompt}>
        <div className="flex flex-wrap justify-center gap-2">
          {decision.options.map((key) => (
            <Button key={key} variant="outline" onClick={() => onAnswer(key)}>
              {decision.optionLabels?.[key] ?? key}
            </Button>
          ))}
          {decision.may && (
            <Button variant="ghost" onClick={() => onAnswer(null)}>
              Decline
            </Button>
          )}
        </div>
      </Banner>
    );
  }

  // chooseInstance — if inline, the board highlights targets; show prompt + actions.
  if (inlineTargets && !multi) {
    return (
      <Banner prompt={decision.prompt} subtitle="Click a highlighted card on the board.">
        {decision.may && (
          <Button variant="ghost" onClick={() => onAnswer(null)}>
            Decline
          </Button>
        )}
      </Banner>
    );
  }

  // chooseInstance — render the option cards (hand/discard/deck picks or multi-select).
  const toggle = (id: string) => {
    if (!multi) {
      onAnswer(id);
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Banner
      prompt={decision.prompt}
      subtitle={multi ? `Select ${min === max ? min : `${min}–${max}`}.` : undefined}
    >
      <div className="uu-decision-cards flex max-h-[40vh] flex-wrap justify-center gap-2 overflow-y-auto p-1">
        {(decision.optionCards ?? []).map((c) => (
          <CardView
            key={c.instanceId}
            card={c}
            size="md"
            selected={selected.includes(c.instanceId)}
            playable={!multi}
            targetable={multi && !selected.includes(c.instanceId)}
            onClick={() => toggle(c.instanceId)}
          />
        ))}
      </div>
      {multi && (
        <div className="mt-2 flex justify-center gap-2">
          <Button
            disabled={selected.length < min || selected.length > max}
            onClick={() => onAnswer(selected)}
          >
            Confirm ({selected.length})
          </Button>
          {decision.may && (
            <Button variant="ghost" onClick={() => onAnswer(null)}>
              Decline
            </Button>
          )}
        </div>
      )}
    </Banner>
  );
}

function Banner({
  prompt,
  subtitle,
  children,
  centered,
}: {
  prompt: string;
  subtitle?: string;
  children?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className="uu-decision-layer pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      data-centered={centered ? "true" : undefined}
    >
      <div
        className={cn(
          "uu-decision-panel uu-glass uu-pop max-w-[92vw] rounded-2xl p-4 text-center shadow-2xl",
          children ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <p className="uu-display mb-1 text-base font-bold text-amber-100">{prompt}</p>
        {subtitle && <p className="mb-2 text-xs text-white/60">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/** Other players are waiting on someone's decision. */
export function WaitingBanner({ name, prompt }: { name: string; prompt: string }) {
  return (
    <div className="uu-waiting-layer pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4">
      <div className="uu-glass rounded-xl px-4 py-2 text-center text-sm text-white/70">
        Waiting for <span className="font-semibold text-amber-200">{name}</span>: {prompt}
      </div>
    </div>
  );
}
