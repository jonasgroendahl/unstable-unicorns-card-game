// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
import { VoiceMicControl, VoicePeerControl } from "./VoiceControls.tsx";
import { VoiceSessionContext, type VoiceSessionValue } from "./voiceSessionContext.ts";

function value(overrides: Partial<VoiceSessionValue> = {}): VoiceSessionValue {
  return {
    connectionStatus: "ready",
    micState: "off",
    micError: null,
    peers: {},
    playbackBlocked: false,
    toggleMicrophone: vi.fn(async () => {}),
    togglePeerMuted: vi.fn(),
    enablePlayback: vi.fn(async () => {}),
    getLocalAudioTrack: vi.fn(() => null),
    ...overrides,
  };
}

function renderWithVoice(ui: React.ReactNode, session: VoiceSessionValue) {
  return render(
    <TooltipProvider>
      <VoiceSessionContext.Provider value={session}>{ui}</VoiceSessionContext.Provider>
    </TooltipProvider>,
  );
}

it("renders an accessible microphone toggle with the visible M shortcut", () => {
  const session = value();
  renderWithVoice(<VoiceMicControl />, session);

  const toggle = screen.getByRole("button", { name: "Turn microphone on" });
  expect(toggle.getAttribute("aria-keyshortcuts")).toBe("M");
  expect(screen.getByText("M")).toBeTruthy();
  fireEvent.click(toggle);
  expect(session.toggleMicrophone).toHaveBeenCalledOnce();
});

it("renders controls only for connected voice peers and isolates mute clicks", () => {
  const togglePeerMuted = vi.fn();
  const session = value({
    peers: { bob: { playerId: "bob", micEnabled: true, muted: false } },
    togglePeerMuted,
  });
  const parentClick = vi.fn();
  const { rerender } = renderWithVoice(
    <div onClick={parentClick}>
      <VoicePeerControl playerId="bob" playerName="Bob" />
    </div>,
    session,
  );

  fireEvent.click(screen.getByRole("button", { name: "Mute Bob" }));
  expect(togglePeerMuted).toHaveBeenCalledWith("bob");
  expect(parentClick).not.toHaveBeenCalled();

  rerender(
    <TooltipProvider>
      <VoiceSessionContext.Provider value={value()}>
        <VoicePeerControl playerId="bob" playerName="Bob" />
      </VoiceSessionContext.Provider>
    </TooltipProvider>,
  );
  expect(screen.queryByRole("button", { name: "Mute Bob" })).toBeNull();
});
