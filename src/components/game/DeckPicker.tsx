import { useMemo, useState } from "react";
import { Layers3, Search } from "lucide-react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";
import {
  DECK_OPTIONS,
  DECKS,
  definitionsForDeck,
  isExcludedInTwoPlayer,
  type DeckId,
} from "#/game/decks.ts";
import { getCardKindLabel, getCardPresentation } from "#/game/themes/cardPresentation.ts";
import { CardView } from "./CardView.tsx";

const CARD_GROUPS = [
  ["baby", "Baby Unicorns"],
  ["basic", "Basic Unicorns"],
  ["magical", "Magical Unicorns"],
  ["magic", "Magic"],
  ["upgrade", "Upgrades"],
  ["downgrade", "Downgrades"],
  ["instant", "Instants"],
] as const;

export function DeckPicker({
  value,
  onChange,
  disabled,
  playerCount,
}: {
  value: DeckId;
  onChange?: (deckId: DeckId) => void;
  disabled?: boolean;
  /** Number of players currently in the lobby; drives 2-player exclusions. */
  playerCount?: number;
}) {
  const { themeId } = useGameTheme();
  const isTwoPlayer = playerCount === 2;
  const [previewDeckId, setPreviewDeckId] = useState<DeckId | null>(null);
  const [query, setQuery] = useState("");
  const previewCards = useMemo(() => {
    if (!previewDeckId) return [];
    const normalized = query.trim().toLowerCase();
    return definitionsForDeck(previewDeckId).filter((card) => {
      const presentation = getCardPresentation(themeId, card);
      return (
        !normalized ||
        presentation.name.toLowerCase().includes(normalized) ||
        card.text.toLowerCase().includes(normalized)
      );
    });
  }, [previewDeckId, query, themeId]);

  return (
    <div className="uu-deck-picker flex flex-col gap-2">
      <span className="uu-deck-picker-label flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        <Layers3 data-icon="inline-start" /> Deck
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        value={value}
        disabled={disabled || !onChange}
        onValueChange={(next) => {
          if (next) onChange?.(next as DeckId);
        }}
        className="uu-deck-options grid w-full grid-cols-2"
        aria-label="Choose a deck"
      >
        {DECK_OPTIONS.map((deck) => (
          <div key={deck.id} className="uu-deck-option relative min-w-0">
            <ToggleGroupItem
              value={deck.id}
              aria-label={deck.name}
              className="uu-deck-option-toggle h-full min-h-28 w-full flex-col items-start justify-start gap-1 whitespace-normal px-3 pb-11 pt-2 text-left"
            >
              <span className="uu-deck-option-title font-semibold">{deck.shortName}</span>
              <span className="uu-deck-option-description text-xs font-normal">
                {deck.description}
              </span>
            </ToggleGroupItem>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="uu-deck-preview absolute right-1.5 bottom-1.5 left-1.5 w-auto"
              aria-label={`Preview ${deck.name} cards`}
              onClick={() => {
                setQuery("");
                setPreviewDeckId(deck.id);
              }}
            >
              <Search data-icon="inline-start" /> Preview cards
            </Button>
          </div>
        ))}
      </ToggleGroup>

      <Dialog
        open={previewDeckId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewDeckId(null);
        }}
      >
        <DialogContent className="flex h-[min(90dvh,56rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{previewDeckId ? DECKS[previewDeckId].name : "Deck preview"}</DialogTitle>
            <DialogDescription>
              Search and inspect every card in this 127-card deck. Copy counts are shown per card.
            </DialogDescription>
          </DialogHeader>
          {isTwoPlayer && (
            <p className="uu-deck-two-player-note rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Cards tagged <Badge variant="outline">Excluded</Badge> are removed from the deck in
              this 2-player game. The official 2-player rules pull all Basic Unicorns plus a handful
              of cards that get too powerful with only two players, and deal each player a Neigh to
              start.
            </p>
          )}
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search card names and rules text..."
            aria-label="Search deck cards"
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-2">
            <div className="flex flex-col gap-7 pb-2 pt-2">
              {CARD_GROUPS.map(([kind]) => {
                const cards = previewCards.filter((card) => card.kind === kind);
                if (cards.length === 0) return null;
                return (
                  <section key={kind} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{getCardKindLabel(themeId, kind)}s</h3>
                      <Badge variant="secondary">
                        {cards.reduce((total, card) => total + card.copies, 0)} cards
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {cards.map((card) => {
                        const presentation = getCardPresentation(themeId, card);
                        const excluded = isTwoPlayer && isExcludedInTwoPlayer(card.id);
                        return (
                          <div
                            key={card.id}
                            className="flex min-w-0 flex-col items-center gap-2"
                            data-excluded={excluded || undefined}
                          >
                            <div className="relative">
                              <CardView
                                card={{
                                  instanceId: `preview-${card.id}`,
                                  slug: card.id,
                                  name: card.name,
                                  kind: card.kind,
                                  cardClass: card.cardClass,
                                  text: card.text,
                                  image: card.image,
                                  ownerId: null,
                                }}
                                size="sm"
                                className={excluded ? "opacity-40 grayscale" : undefined}
                              />
                              {excluded && (
                                <Badge
                                  variant="destructive"
                                  className="absolute -top-1.5 left-1/2 -translate-x-1/2"
                                  title="Removed from the deck in 2-player games"
                                >
                                  Excluded
                                </Badge>
                              )}
                            </div>
                            <div className="flex min-w-0 items-center justify-center gap-1">
                              <span className="truncate text-center text-xs font-medium">
                                {presentation.name}
                              </span>
                              {card.copies > 1 && <Badge variant="outline">x{card.copies}</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {previewCards.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No cards match “{query}”.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
