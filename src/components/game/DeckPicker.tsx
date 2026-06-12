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
import { DECK_OPTIONS, DECKS, definitionsForDeck, type DeckId } from "#/game/decks.ts";
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
}: {
  value: DeckId;
  onChange?: (deckId: DeckId) => void;
  disabled?: boolean;
}) {
  const [previewDeckId, setPreviewDeckId] = useState<DeckId | null>(null);
  const [query, setQuery] = useState("");
  const previewCards = useMemo(() => {
    if (!previewDeckId) return [];
    const normalized = query.trim().toLowerCase();
    return definitionsForDeck(previewDeckId).filter(
      (card) =>
        !normalized ||
        card.name.toLowerCase().includes(normalized) ||
        card.text.toLowerCase().includes(normalized),
    );
  }, [previewDeckId, query]);

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/60">
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
        className="grid w-full grid-cols-2"
        aria-label="Choose a deck"
      >
        {DECK_OPTIONS.map((deck) => (
          <div key={deck.id} className="relative min-w-0">
            <ToggleGroupItem
              value={deck.id}
              aria-label={deck.name}
              className="h-full min-h-28 w-full flex-col items-start justify-start gap-1 whitespace-normal px-3 pb-11 pt-2 text-left"
            >
              <span className="font-semibold">{deck.shortName}</span>
              <span className="text-xs font-normal opacity-70">{deck.description}</span>
            </ToggleGroupItem>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute bottom-1.5 left-1.5 right-1.5 w-auto"
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
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search card names and rules text..."
            aria-label="Search deck cards"
          />
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <div className="flex flex-col gap-7 pb-2">
              {CARD_GROUPS.map(([kind, label]) => {
                const cards = previewCards.filter((card) => card.kind === kind);
                if (cards.length === 0) return null;
                return (
                  <section key={kind} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{label}</h3>
                      <Badge variant="secondary">
                        {cards.reduce((total, card) => total + card.copies, 0)} cards
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {cards.map((card) => (
                        <div key={card.id} className="flex min-w-0 flex-col items-center gap-2">
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
                          />
                          <div className="flex min-w-0 items-center justify-center gap-1">
                            <span className="truncate text-center text-xs font-medium">
                              {card.name}
                            </span>
                            {card.copies > 1 && <Badge variant="outline">x{card.copies}</Badge>}
                          </div>
                        </div>
                      ))}
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
