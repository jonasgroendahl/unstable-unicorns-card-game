// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { GameThemeProvider } from "#/components/theme/GameThemeProvider.tsx";
import { DeckPicker } from "./DeckPicker.tsx";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

afterEach(cleanup);

function renderPicker(
  props: Partial<ComponentProps<typeof DeckPicker>> & {
    onChange?: ComponentProps<typeof DeckPicker>["onChange"];
    onExpansionChange?: ComponentProps<typeof DeckPicker>["onExpansionChange"];
  } = {},
) {
  return render(
    <GameThemeProvider>
      <DeckPicker value="base-first-edition" expansionIds={[]} {...props} />
    </GameThemeProvider>,
  );
}

describe("DeckPicker catalog", () => {
  it("quick-selects playable decks and toggles Adventures", () => {
    const onChange = vi.fn();
    const onExpansionChange = vi.fn();
    const { rerender } = renderPicker({ onChange, onExpansionChange });

    fireEvent.click(screen.getByRole("radio", { name: "Select Base Deck, Second Edition" }));
    expect(onChange).toHaveBeenCalledWith("base-second-edition");

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Adventures Expansion, Second Edition" }),
    );
    expect(onExpansionChange).toHaveBeenCalledWith(["adventures-second-edition"]);

    rerender(
      <GameThemeProvider>
        <DeckPicker
          value="base-second-edition"
          expansionIds={["adventures-second-edition"]}
          onChange={onChange}
          onExpansionChange={onExpansionChange}
        />
      </GameThemeProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Adventures Expansion, Second Edition" }),
    );
    expect(onExpansionChange).toHaveBeenLastCalledWith([]);
  });

  it("shows every product and never selects unavailable catalog entries", () => {
    const onChange = vi.fn();
    const onExpansionChange = vi.fn();
    renderPicker({ onChange, onExpansionChange });

    fireEvent.click(screen.getByRole("button", { name: "Browse all decks & expansions" }));

    const dialog = screen.getByRole("dialog", { name: "Deck and expansion catalog" });
    expect(within(dialog).getByText("Control")).toBeTruthy();
    expect(within(dialog).getByText("Nightmares")).toBeTruthy();
    expect(within(dialog).getByAltText("Control Base Deck box").getAttribute("src")).toBe(
      "/decks/base-control.webp",
    );

    const unavailableCard = within(dialog).getByTestId("catalog-base-control");
    const unavailableButton = within(unavailableCard).getByRole("button", {
      name: "Unavailable",
    }) as HTMLButtonElement;
    expect(unavailableButton.disabled).toBe(true);
    fireEvent.click(unavailableButton);
    expect(onChange).not.toHaveBeenCalled();
    expect(onExpansionChange).not.toHaveBeenCalled();

    const secondEditionCard = within(dialog).getByTestId("catalog-base-second-edition");
    fireEvent.click(within(secondEditionCard).getByRole("button", { name: "Select deck" }));
    expect(onChange).toHaveBeenCalledWith("base-second-edition");

    const adventuresCard = within(dialog).getByTestId("catalog-adventures-second-edition");
    fireEvent.click(within(adventuresCard).getByRole("button", { name: "Add expansion" }));
    expect(onExpansionChange).toHaveBeenCalledWith(["adventures-second-edition"]);
  });

  it("lets guests browse while keeping playable controls read-only", () => {
    renderPicker();

    const quickSelect = screen.getByRole("radio", {
      name: "Select Base Deck, Second Edition",
    }) as HTMLButtonElement;
    expect(quickSelect.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Browse all decks & expansions" }));
    const dialog = screen.getByRole("dialog", { name: "Deck and expansion catalog" });
    const secondEditionCard = within(dialog).getByTestId("catalog-base-second-edition");
    const selectButton = within(secondEditionCard).getByRole("button", {
      name: "Select deck",
    }) as HTMLButtonElement;
    expect(selectButton.disabled).toBe(true);
    expect(within(dialog).getByAltText("Nightmares Expansion Pack box")).toBeTruthy();
  });
});
