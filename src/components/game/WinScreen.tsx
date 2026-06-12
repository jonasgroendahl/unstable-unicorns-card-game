import { Link } from "@tanstack/react-router";
import { Crown, Home, RotateCcw, Trophy } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";

export function WinScreen({ winnerName, youWon }: { winnerName: string; youWon: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="uu-glass uu-pop w-[min(92vw,460px)] rounded-2xl p-8 text-center shadow-2xl">
        <Crown className="mx-auto mb-3 size-16 text-amber-300 drop-shadow" />
        <h2 className="uu-display text-3xl font-bold text-amber-200">
          {youWon ? "You win!" : `${winnerName} wins!`}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          {youWon
            ? "Your Unicorn Army is complete. Bow down, mortals. 🦄"
            : "Their Unicorn Army is complete. Better luck next time!"}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="size-4" /> Home
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RotateCcw className="size-4" /> Play again
          </Button>
          <Button variant="outline" asChild>
            <Link to="/history">
              <Trophy data-icon="inline-start" /> History
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
