import { useSyncExternalStore } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { audio } from "#/lib/audio.ts";
import { cn } from "#/lib/utils.ts";

function useAudioPrefs() {
  return useSyncExternalStore(
    (cb) => audio.subscribe(cb),
    () => audio.prefs,
    () => audio.prefs,
  );
}

export function AudioControl({ className, compact }: { className?: string; compact?: boolean }) {
  const prefs = useAudioPrefs();
  if (compact) {
    return (
      <button
        onClick={() => {
          audio.unlock();
          audio.setMuted(!prefs.muted);
          if (!prefs.muted) audio.play("click");
        }}
        title={prefs.muted ? "Unmute" : "Mute"}
        aria-label={prefs.muted ? "Unmute" : "Mute"}
        className={cn(
          "uu-glass grid size-10 place-items-center rounded-full text-white/80 hover:text-white",
          className,
        )}
      >
        {prefs.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
    );
  }

  return (
    <div className={cn("uu-glass flex items-center gap-2 rounded-full px-2.5 py-1.5", className)}>
      <button
        onClick={() => {
          audio.unlock();
          audio.setMuted(!prefs.muted);
          if (!prefs.muted) audio.play("click");
        }}
        title={prefs.muted ? "Unmute" : "Mute"}
        className="text-white/80 hover:text-white"
      >
        {prefs.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={prefs.sfxVolume}
        onChange={(e) => audio.setSfxVolume(Number(e.currentTarget.value))}
        className="h-5 w-16 cursor-pointer touch-none accent-amber-400"
        title="Sound effects volume"
        aria-label="Sound effects volume"
      />
      <Music className="size-3.5 text-white/50" />
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={prefs.musicVolume}
        onChange={(e) => {
          audio.setMusicVolume(Number(e.currentTarget.value));
          audio.startMusic();
        }}
        className="h-5 w-12 cursor-pointer touch-none accent-fuchsia-400"
        title="Music volume"
        aria-label="Music volume"
      />
    </div>
  );
}
