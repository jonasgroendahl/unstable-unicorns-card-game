import { useMemo, useState } from "react";
import { Check, Compass, Layers3, LibraryBig, LockKeyhole, Search } from "lucide-react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { ScrollArea } from "#/components/ui/scroll-area.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { useGameTheme } from "#/components/theme/GameThemeProvider.tsx";
import {
  DECK_CATALOG,
  DECK_OPTIONS,
  DECKS,
  EXPANSION_CATALOG,
  EXPANSIONS,
  definitionsForExpansion,
  definitionsForDeck,
  isExcludedInTwoPlayer,
  type DeckCatalogEntry,
  type DeckId,
  type ExpansionCatalogEntry,
  type ExpansionId,
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

type AvailableCatalogEntry = Extract<
  DeckCatalogEntry | ExpansionCatalogEntry,
  { availability: "available" }
>;
type UnavailableCatalogEntry = Extract<
  DeckCatalogEntry | ExpansionCatalogEntry,
  { availability: "unavailable" }
>;

function ProductImage({
  src,
  name,
  className,
  loading,
}: {
  src: string;
  name: string;
  className: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <img
      src={src}
      alt={`${name} box`}
      loading={loading}
      className={`${className} uu-product-image rounded-lg object-contain`}
    />
  );
}

function CatalogProductCard(
  props:
    | {
        entry: AvailableCatalogEntry;
        selected: boolean;
        canSelect: boolean;
        cardCountLabel: string;
        actionLabel: string;
        selectedLabel: string;
        onSelect: () => void;
      }
    | {
        entry: UnavailableCatalogEntry;
      },
) {
  const { entry } = props;
  const availableProps = "selected" in props ? props : null;

  return (
    <Card className="gap-3 overflow-hidden py-0" data-testid={`catalog-${entry.id}`}>
      <CardContent className="uu-product-plate flex h-40 items-center justify-center px-4 py-3 sm:h-44">
        <ProductImage src={entry.image} name={entry.name} loading="lazy" className="size-full" />
      </CardContent>
      <CardHeader className="gap-2 px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={availableProps ? "outline" : "secondary"}>
            {availableProps ? "Available" : "Unavailable"}
          </Badge>
          {availableProps ? (
            <Badge variant="secondary">{availableProps.cardCountLabel}</Badge>
          ) : null}
        </div>
        <CardTitle>{entry.shortName}</CardTitle>
        <CardDescription>{entry.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto px-4 pb-4">
        {availableProps ? (
          <Button
            type="button"
            variant={availableProps.selected ? "secondary" : "outline"}
            className="w-full"
            disabled={!availableProps.canSelect}
            aria-pressed={availableProps.selected}
            onClick={availableProps.onSelect}
          >
            {availableProps.selected ? (
              <Check data-icon="inline-start" />
            ) : (
              <Layers3 data-icon="inline-start" />
            )}
            {availableProps.selected ? availableProps.selectedLabel : availableProps.actionLabel}
          </Button>
        ) : (
          <Button type="button" variant="outline" className="w-full" disabled>
            <LockKeyhole data-icon="inline-start" />
            Unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function DeckPicker({
  value,
  onChange,
  expansionIds = [],
  onExpansionChange,
  disabled,
  playerCount,
}: {
  value: DeckId;
  onChange?: (deckId: DeckId) => void;
  expansionIds?: ExpansionId[];
  onExpansionChange?: (expansionIds: ExpansionId[]) => void;
  disabled?: boolean;
  /** Number of players currently in the lobby; drives 2-player exclusions. */
  playerCount?: number;
}) {
  const { themeId } = useGameTheme();
  const isTwoPlayer = playerCount === 2;
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [preview, setPreview] = useState<
    { kind: "base"; id: DeckId } | { kind: "expansion"; id: ExpansionId } | null
  >(null);
  const [query, setQuery] = useState("");
  const selectedDeck = DECKS[value];
  const adventures = EXPANSIONS["adventures-second-edition"];
  const adventuresSelected = expansionIds.includes("adventures-second-edition");
  const canChangeDeck = !disabled && Boolean(onChange);
  const canChangeExpansions = !disabled && Boolean(onExpansionChange);

  const previewCards = useMemo(() => {
    if (!preview) return [];
    const normalized = query.trim().toLowerCase();
    const definitions =
      preview.kind === "base"
        ? definitionsForDeck(preview.id)
        : definitionsForExpansion(preview.id);
    return definitions.filter((card) => {
      const presentation = getCardPresentation(themeId, card);
      return (
        !normalized ||
        presentation.name.toLowerCase().includes(normalized) ||
        card.text.toLowerCase().includes(normalized)
      );
    });
  }, [preview, query, themeId]);

  const previewName =
    preview?.kind === "base"
      ? DECKS[preview.id].name
      : preview?.kind === "expansion"
        ? EXPANSIONS[preview.id].name
        : "Deck preview";
  const previewCardCount =
    preview?.kind === "base"
      ? DECKS[preview.id].cardCount
      : preview?.kind === "expansion"
        ? EXPANSIONS[preview.id].cardCount
        : 0;

  const toggleExpansion = (expansionId: ExpansionId) => {
    if (expansionIds.includes(expansionId)) {
      onExpansionChange?.(expansionIds.filter((id) => id !== expansionId));
    } else {
      onExpansionChange?.([...expansionIds, expansionId]);
    }
  };

  return (
    <div className="uu-deck-picker flex flex-col gap-3">
      <section className="flex flex-col gap-2" aria-labelledby="base-deck-heading">
        <span
          id="base-deck-heading"
          className="uu-deck-picker-label flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
        >
          <Layers3 data-icon="inline-start" /> Base deck
        </span>
        <div className="uu-deck-current grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-xl border p-3">
          <ProductImage
            src={selectedDeck.image}
            name={selectedDeck.name}
            loading="eager"
            className="h-20 w-[4.5rem]"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="truncate">{selectedDeck.shortName}</strong>
              <Badge variant="secondary">{selectedDeck.cardCount} cards</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{selectedDeck.description}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-auto self-start"
              aria-label={`Preview ${selectedDeck.name} cards`}
              onClick={() => {
                setQuery("");
                setPreview({ kind: "base", id: value });
              }}
            >
              <Search data-icon="inline-start" /> Preview selected deck
            </Button>
          </div>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={value}
          disabled={!canChangeDeck}
          onValueChange={(next) => {
            if (next) onChange?.(next as DeckId);
          }}
          className="uu-deck-quick-select grid w-full grid-cols-2"
          aria-label="Quick select a base deck"
        >
          {DECK_OPTIONS.map((deck) => (
            <ToggleGroupItem
              key={deck.id}
              value={deck.id}
              aria-label={`Select ${deck.name}`}
              className="w-full"
            >
              {deck.shortName}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="expansion-deck-heading">
        <span
          id="expansion-deck-heading"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
        >
          <Compass data-icon="inline-start" /> Expansion packs
          <Badge variant="secondary">Optional</Badge>
        </span>
        <div className="uu-deck-current grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-xl border p-3">
          <ProductImage
            src={adventures.image}
            name={adventures.name}
            loading="eager"
            className="h-20 w-[4.5rem]"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <strong>
                {adventuresSelected ? "Adventures included" : "No expansion selected"}
              </strong>
              <Badge variant={adventuresSelected ? "default" : "outline"}>
                {adventuresSelected ? `+${adventures.cardCount} cards` : "Optional"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {adventuresSelected
                ? adventures.description
                : "Add Adventures now, or browse the full expansion catalog below."}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={adventuresSelected ? "secondary" : "default"}
                disabled={!canChangeExpansions}
                aria-pressed={adventuresSelected}
                aria-label={`Toggle ${adventures.name}`}
                onClick={() => toggleExpansion(adventures.id)}
              >
                {adventuresSelected ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Layers3 data-icon="inline-start" />
                )}
                {adventuresSelected ? "Remove Adventures" : "Add Adventures"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Preview ${adventures.name} cards`}
                onClick={() => {
                  setQuery("");
                  setPreview({ kind: "expansion", id: adventures.id });
                }}
              >
                <Search data-icon="inline-start" /> Preview
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setCatalogOpen(true)}
      >
        <LibraryBig data-icon="inline-start" />
        Browse all decks & expansions
      </Button>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="flex h-[min(92dvh,58rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Deck and expansion catalog</DialogTitle>
            <DialogDescription>
              Quick-select supported products or explore what is coming to the game later.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1 pr-3">
            <div className="flex flex-col gap-8 pb-2">
              <section className="flex flex-col gap-3" aria-labelledby="catalog-base-decks">
                <div className="flex items-center gap-2">
                  <h3 id="catalog-base-decks" className="font-semibold">
                    Base decks
                  </h3>
                  <Badge variant="secondary">{DECK_CATALOG.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {DECK_CATALOG.map((entry) =>
                    entry.availability === "available" ? (
                      <CatalogProductCard
                        key={entry.id}
                        entry={entry}
                        selected={value === entry.playableId}
                        canSelect={canChangeDeck}
                        cardCountLabel={`${entry.cardCount} cards`}
                        actionLabel="Select deck"
                        selectedLabel="Selected deck"
                        onSelect={() => onChange?.(entry.playableId)}
                      />
                    ) : (
                      <CatalogProductCard key={entry.id} entry={entry} />
                    ),
                  )}
                </div>
              </section>

              <section className="flex flex-col gap-3" aria-labelledby="catalog-expansion-packs">
                <div className="flex items-center gap-2">
                  <h3 id="catalog-expansion-packs" className="font-semibold">
                    Expansion packs
                  </h3>
                  <Badge variant="secondary">{EXPANSION_CATALOG.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {EXPANSION_CATALOG.map((entry) =>
                    entry.availability === "available" ? (
                      <CatalogProductCard
                        key={entry.id}
                        entry={entry}
                        selected={expansionIds.includes(entry.playableId)}
                        canSelect={canChangeExpansions}
                        cardCountLabel={`+${entry.cardCount} cards`}
                        actionLabel="Add expansion"
                        selectedLabel="Remove expansion"
                        onSelect={() => toggleExpansion(entry.playableId)}
                      />
                    ) : (
                      <CatalogProductCard key={entry.id} entry={entry} />
                    ),
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="flex h-[min(90dvh,56rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
            <DialogDescription>
              Search and inspect every card in this {previewCardCount}-card deck. Copy counts are
              shown per card.
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
