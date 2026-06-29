// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddBotControl, BotDifficultyBadge, BotDifficultyToggle } from "./BotDifficultyControl";

afterEach(cleanup);

describe("bot difficulty lobby controls", () => {
  it("defaults new bots to easy, submits the selected level, and retains it", async () => {
    const onAdd = vi.fn(async () => {});
    render(<AddBotControl onAdd={onAdd} />);

    expect(screen.getByRole("radio", { name: "Easy difficulty" }).getAttribute("data-state")).toBe(
      "on",
    );
    fireEvent.click(screen.getByRole("radio", { name: "Medium difficulty" }));
    fireEvent.click(screen.getByRole("button", { name: "Add bot" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("medium"));
    expect(
      screen.getByRole("radio", { name: "Medium difficulty" }).getAttribute("data-state"),
    ).toBe("on");
  });

  it("supports host editing and a read-only guest badge", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <BotDifficultyToggle value="easy" onChange={onChange} ariaLabel="Difficulty for Bot 1" />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Hard difficulty" }));
    expect(onChange).toHaveBeenCalledWith("hard");

    rerender(<BotDifficultyBadge difficulty="hard" />);
    expect(screen.getByText("Hard")).toBeTruthy();
  });

  it("disables adding when the lobby is full", () => {
    render(<AddBotControl disabled onAdd={vi.fn(async () => {})} />);
    expect((screen.getByRole("button", { name: "Add bot" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
