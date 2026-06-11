import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { ScrollArea } from "#/components/ui/scroll-area.tsx";
import { cn } from "#/lib/utils.ts";
import type { GameView } from "#/game/view.ts";

const KIND_COLOR: Record<string, string> = {
  death: "text-rose-300",
  destroy: "text-rose-300",
  neigh: "text-amber-300",
  neighed: "text-amber-300",
  win: "text-emerald-300 font-bold",
  turn: "text-fuchsia-200 font-semibold",
  play: "text-sky-200",
  prevent: "text-violet-300",
  error: "text-rose-400 italic",
};

export function GameLog({ log }: { log: GameView["log"] }) {
  const [expanded, setExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToLatest = () => {
      const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      viewport?.scrollTo({ top: viewport.scrollHeight });
    };

    scrollToLatest();
    const afterResize = window.setTimeout(scrollToLatest, 220);
    return () => window.clearTimeout(afterResize);
  }, [expanded, log.length]);

  return (
    <div className="uu-glass flex max-h-full w-full flex-col overflow-hidden rounded-xl p-2">
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
          Game Log
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-expanded={expanded}
          aria-label={expanded ? "Show fewer game log entries" : "Show more game log entries"}
          className="h-5 px-1.5 text-[10px] text-white/55 hover:bg-white/10 hover:text-white"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show 5" : "Show 15"}
          <ChevronDown
            data-icon="inline-end"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </Button>
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className={cn(
          "min-h-0 max-h-64 shrink transition-[height] duration-200",
          expanded ? "h-64" : "h-[5.25rem]",
        )}
      >
        <div className="flex flex-col gap-0.5 pr-2">
          {log.map((e) => (
            <p
              key={e.t}
              className={cn("text-[11px] leading-snug text-white/75", KIND_COLOR[e.kind])}
            >
              {e.message}
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
