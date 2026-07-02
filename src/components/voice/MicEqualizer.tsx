import { useEffect, useRef } from "react";
import { cn } from "#/lib/utils.ts";
import { useVoiceSession } from "./voiceSessionContext.ts";

const BAR_COUNT = 3;

/**
 * A tiny 3-bar equalizer that reacts to the local microphone's live level.
 *
 * Kept deliberately lightweight: a single AnalyserNode feeds one
 * requestAnimationFrame loop that writes bar heights straight to CSS custom
 * properties, so animating never re-renders React. It only runs while the mic
 * is on and the user hasn't asked to reduce motion, and it tears the AudioContext
 * down the moment either stops being true.
 */
export function MicEqualizer({ className, active }: { className?: string; active: boolean }) {
  const { getLocalAudioTrack } = useVoiceSession();
  const barsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const track = getLocalAudioTrack();
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!track || track.readyState !== "live" || !AudioContextCtor) return;

    let disposed = false;
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 32;
    analyser.smoothingTimeConstant = 0.75;
    const source = context.createMediaStreamSource(new MediaStream([track]));
    source.connect(analyser);

    const bins = new Uint8Array(analyser.frequencyBinCount);
    // Sample three spread-out low/mid bins so the bars move independently.
    const bandIndexes = [1, 3, 6];
    let frame = 0;

    const render = () => {
      if (disposed) return;
      analyser.getByteFrequencyData(bins);
      const el = barsRef.current;
      if (el) {
        for (let i = 0; i < BAR_COUNT; i++) {
          const raw = (bins[bandIndexes[i]] ?? 0) / 255;
          // Ease toward a 0.15–1 range so idle noise stays a low flicker, not flat.
          const scale = 0.15 + Math.min(1, raw * 1.4) * 0.85;
          el.style.setProperty(`--uu-eq-bar-${i}`, scale.toFixed(3));
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
    };
  }, [active, getLocalAudioTrack]);

  if (!active) return null;

  return (
    <span
      ref={barsRef}
      className={cn("uu-voice-eq", className)}
      aria-hidden="true"
      data-testid="mic-equalizer"
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span
          key={i}
          className="uu-voice-eq-bar"
          style={{ "--uu-eq-index": i } as React.CSSProperties}
        />
      ))}
    </span>
  );
}
