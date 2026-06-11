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

export function AudioControl({ className }: { className?: string }) {
  const prefs = useAudioPrefs();
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
        onChange={(e) => audio.setSfxVolume(Number(e.target.value))}
        className="h-1 w-16 accent-amber-400"
        title="Sound effects volume"
      />
      <Music className="size-3.5 text-white/50" />
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={prefs.musicVolume}
        onChange={(e) => {
          audio.setMusicVolume(Number(e.target.value));
          audio.startMusic();
        }}
        className="h-1 w-12 accent-fuchsia-400"
        title="Music volume"
      />
    </div>
  );
}
