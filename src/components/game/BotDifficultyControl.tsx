import { useState } from "react";
import { Bot } from "lucide-react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from "#/game/types.ts";

export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function BotDifficultyBadge({ difficulty }: { difficulty?: BotDifficulty }) {
  return (
    <Badge variant="secondary" className="uu-lobby-bot-difficulty-badge">
      {BOT_DIFFICULTY_LABELS[difficulty ?? DEFAULT_BOT_DIFFICULTY]}
    </Badge>
  );
}

export function BotDifficultyToggle({
  value,
  onChange,
  disabled,
  ariaLabel = "Bot difficulty",
  compact = false,
}: {
  value: BotDifficulty;
  onChange?: (difficulty: BotDifficulty) => void;
  disabled?: boolean;
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      variant="outline"
      size={compact ? "sm" : "default"}
      spacing={0}
      disabled={disabled || !onChange}
      aria-label={ariaLabel}
      className={
        compact
          ? "uu-bot-difficulty-toggle uu-bot-difficulty-toggle-compact"
          : "uu-bot-difficulty-toggle"
      }
      onValueChange={(next) => {
        if (next) onChange?.(next as BotDifficulty);
      }}
    >
      {BOT_DIFFICULTIES.map((difficulty) => (
        <ToggleGroupItem
          key={difficulty}
          value={difficulty}
          aria-label={`${BOT_DIFFICULTY_LABELS[difficulty]} difficulty`}
        >
          {BOT_DIFFICULTY_LABELS[difficulty]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function AddBotControl({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: (difficulty: BotDifficulty) => Promise<void>;
}) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>(DEFAULT_BOT_DIFFICULTY);
  const [adding, setAdding] = useState(false);

  return (
    <div className="uu-lobby-add-bot-control">
      <span className="uu-lobby-add-bot-label">Bot difficulty</span>
      <div className="uu-lobby-add-bot-actions">
        <BotDifficultyToggle value={difficulty} onChange={setDifficulty} disabled={adding} />
        <Button
          className="uu-lobby-add-bot"
          disabled={disabled || adding}
          onClick={async () => {
            setAdding(true);
            try {
              await onAdd(difficulty);
            } finally {
              setAdding(false);
            }
          }}
        >
          <Bot data-icon="inline-start" /> {adding ? "Adding…" : "Add bot"}
        </Button>
      </div>
    </div>
  );
}
