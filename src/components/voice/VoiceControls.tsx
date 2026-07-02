import { Headphones, LoaderCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { Toggle } from "#/components/ui/toggle.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip.tsx";
import { cn } from "#/lib/utils.ts";
import { MicEqualizer } from "./MicEqualizer.tsx";
import { useVoiceSession } from "./voiceSessionContext.ts";

export function VoiceMicControl({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const voice = useVoiceSession();
  const isOn = voice.micState === "on";
  const isBusy = voice.micState === "requesting";
  const unavailable =
    voice.connectionStatus === "unsupported" ||
    voice.connectionStatus === "replaced" ||
    voice.micState === "unavailable";
  const label = isOn ? "Turn microphone off" : "Turn microphone on";
  const detail =
    voice.connectionStatus === "replaced"
      ? "Voice moved to another tab."
      : (voice.micError ??
        (voice.connectionStatus === "connecting"
          ? "Voice is reconnecting. Microphone changes will be applied when connected."
          : `${label}. Keyboard shortcut: M`));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            variant="outline"
            size={compact ? "sm" : "default"}
            pressed={isOn}
            disabled={isBusy || unavailable}
            aria-label={label}
            aria-keyshortcuts="M"
            data-voice-status={voice.connectionStatus}
            data-mic-state={voice.micState}
            data-voice-peer-count={Object.keys(voice.peers).length}
            onPressedChange={() => void voice.toggleMicrophone()}
            className="uu-voice-mic"
          >
            {isBusy ? <LoaderCircle className="animate-spin" /> : isOn ? <Mic /> : <MicOff />}
            {isOn && <MicEqualizer active={isOn} />}
            {!compact && <span>{isBusy ? "Starting…" : isOn ? "Mic on" : "Mic off"}</span>}
            <kbd className="rounded border border-current/25 px-1 text-[10px] font-bold">M</kbd>
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="bottom">{detail}</TooltipContent>
      </Tooltip>

      {voice.playbackBlocked && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size={compact ? "icon-sm" : "sm"}
              variant="secondary"
              aria-label="Enable voice audio"
              onClick={() => void voice.enablePlayback()}
            >
              <Headphones />
              {!compact && <span>Enable voice</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Your browser paused incoming voice. Click to hear other players.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function VoicePeerControl({
  playerId,
  playerName,
  className,
}: {
  playerId: string;
  playerName: string;
  className?: string;
}) {
  const voice = useVoiceSession();
  const peer = voice.peers[playerId];
  if (!peer) return null;

  return (
    <div
      className={cn("flex shrink-0 items-center gap-1", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span
        className="text-muted-foreground"
        title={
          peer.micEnabled ? `${playerName}'s microphone is on` : `${playerName}'s microphone is off`
        }
        aria-label={
          peer.micEnabled ? `${playerName}'s microphone is on` : `${playerName}'s microphone is off`
        }
      >
        {peer.micEnabled ? <Mic className="size-3" /> : <MicOff className="size-3" />}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            type="button"
            size="sm"
            variant="outline"
            pressed={peer.muted}
            aria-label={peer.muted ? `Unmute ${playerName}` : `Mute ${playerName}`}
            onPressedChange={() => voice.togglePeerMuted(playerId)}
            className="size-7 min-w-7 p-0"
          >
            {peer.muted ? <VolumeX /> : <Volume2 />}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {peer.muted ? `Hear ${playerName}` : `Mute ${playerName} for you`}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
