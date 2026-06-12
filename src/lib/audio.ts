// Procedural sound effects and fallback music via the Web Audio API, with
// optional drop-in background music at /audio/music.*. Preferences persist to
// localStorage.

type Sfx =
  | "play"
  | "draw"
  | "neigh"
  | "neighed"
  | "destroy"
  | "sacrifice"
  | "steal"
  | "win"
  | "lose"
  | "tick"
  | "turn"
  | "click"
  | "deal";

interface AudioPrefs {
  muted: boolean;
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
}

const STORAGE_KEY = "uu.audio.prefs";

function loadPrefs(): AudioPrefs {
  if (typeof localStorage === "undefined")
    return { muted: false, sfxVolume: 0.6, musicVolume: 0.3 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { muted: false, sfxVolume: 0.6, musicVolume: 0.3, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { muted: false, sfxVolume: 0.6, musicVolume: 0.3 };
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private musicMaster: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private musicTried = false;
  prefs: AudioPrefs = loadPrefs();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    for (const fn of this.listeners) fn();
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.prefs.sfxVolume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call once on a user gesture to unlock audio. */
  unlock() {
    this.ensureCtx();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      /* ignore */
    }
    if (this.master) this.master.gain.value = this.prefs.muted ? 0 : this.prefs.sfxVolume;
    if (this.music) this.music.volume = this.prefs.muted ? 0 : this.prefs.musicVolume;
    if (this.musicMaster) {
      this.musicMaster.gain.value = this.prefs.muted ? 0 : this.prefs.musicVolume * 0.12;
    }
    this.notify();
  }

  setMuted(muted: boolean) {
    this.prefs = { ...this.prefs, muted };
    if (!muted) this.ensureCtx();
    this.persist();
  }
  setSfxVolume(v: number) {
    this.prefs = { ...this.prefs, sfxVolume: Math.max(0, Math.min(1, v)) };
    this.persist();
  }
  setMusicVolume(v: number) {
    this.prefs = { ...this.prefs, musicVolume: Math.max(0, Math.min(1, v)) };
    this.persist();
  }

  // --- procedural SFX ------------------------------------------------------
  private tone(opts: {
    freq: number;
    type?: OscillatorType;
    dur: number;
    gain?: number;
    slideTo?: number;
    delay?: number;
  }) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.master || this.prefs.muted) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + opts.dur);
    const peak = opts.gain ?? 0.4;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private chord(freqs: number[], dur: number, type: OscillatorType = "triangle", stagger = 0) {
    freqs.forEach((f, i) => this.tone({ freq: f, type, dur, gain: 0.22, delay: i * stagger }));
  }

  play(sfx: Sfx) {
    switch (sfx) {
      case "click":
        this.tone({ freq: 420, type: "square", dur: 0.06, gain: 0.12 });
        break;
      case "play":
        this.tone({ freq: 330, type: "triangle", dur: 0.16, slideTo: 520, gain: 0.3 });
        break;
      case "draw":
        this.tone({ freq: 600, type: "sine", dur: 0.12, slideTo: 820, gain: 0.22 });
        break;
      case "deal":
        this.tone({ freq: 500, type: "sine", dur: 0.08, slideTo: 700, gain: 0.18 });
        break;
      case "neigh":
        // A whinny-ish descending warble.
        this.tone({ freq: 880, type: "sawtooth", dur: 0.28, slideTo: 180, gain: 0.32 });
        this.tone({ freq: 660, type: "square", dur: 0.18, slideTo: 140, gain: 0.18, delay: 0.04 });
        break;
      case "neighed":
        // A sharp rejection followed by the cancelled card falling away.
        this.chord([740, 554], 0.16, "square");
        this.tone({ freq: 360, type: "sawtooth", dur: 0.42, slideTo: 70, gain: 0.36, delay: 0.1 });
        break;
      case "destroy":
        this.tone({ freq: 200, type: "sawtooth", dur: 0.3, slideTo: 60, gain: 0.4 });
        break;
      case "sacrifice":
        this.tone({ freq: 260, type: "triangle", dur: 0.22, slideTo: 110, gain: 0.3 });
        break;
      case "steal":
        this.tone({ freq: 400, type: "sine", dur: 0.18, slideTo: 760, gain: 0.26 });
        break;
      case "turn":
        this.chord([392, 523], 0.22, "triangle", 0.05);
        break;
      case "tick":
        this.tone({ freq: 1040, type: "square", dur: 0.04, gain: 0.1 });
        break;
      case "win":
        this.chord([523, 659, 784, 1047], 0.5, "triangle", 0.09);
        break;
      case "lose":
        this.chord([392, 311, 233], 0.5, "sawtooth", 0.12);
        break;
    }
  }

  // --- optional background music ------------------------------------------
  startMusic() {
    if (typeof Audio === "undefined" || this.musicTried) return;
    this.musicTried = true;
    // Try common drop-in filenames first, then use synthesized music so a
    // missing production asset never leaves the music control doing nothing.
    const candidates = [
      "/audio/music.mp3",
      "/audio/music.ogg",
      "/audio/theme.mp3",
      "/audio/music.wav",
    ];
    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        this.startProceduralMusic();
        return;
      }
      const a = new Audio(candidates[i]);
      a.loop = true;
      a.preload = "auto";
      a.volume = this.prefs.muted ? 0 : this.prefs.musicVolume;
      this.music = a;

      let advanced = false;
      const next = () => {
        if (advanced) return;
        advanced = true;
        a.pause();
        if (this.music === a) this.music = null;
        tryNext(i + 1);
      };

      a.addEventListener("error", next, { once: true });
      // Calling play during the user gesture avoids production autoplay blocks
      // while the browser buffers the file.
      void a.play().catch(next);
    };
    tryNext(0);
  }

  private startProceduralMusic() {
    if (this.musicTimer) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    this.musicMaster = ctx.createGain();
    this.musicMaster.gain.value = this.prefs.muted ? 0 : this.prefs.musicVolume * 0.12;
    this.musicMaster.connect(ctx.destination);

    const playStep = () => {
      const melody = [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 349.23];
      const note = melody[this.musicStep % melody.length];
      this.musicTone(note, 1.25, 0.24, "sine");
      if (this.musicStep % 4 === 0) this.musicTone(note / 2, 2.5, 0.18, "triangle");
      this.musicStep += 1;
    };

    playStep();
    this.musicTimer = setInterval(playStep, 900);
  }

  private musicTone(freq: number, dur: number, gain: number, type: OscillatorType) {
    const ctx = this.ctx;
    if (!ctx || !this.musicMaster) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    envelope.gain.setValueAtTime(0.0001, t0);
    envelope.gain.exponentialRampToValueAtTime(gain, t0 + 0.08);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(envelope);
    envelope.connect(this.musicMaster);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  stopMusic() {
    this.music?.pause();
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const audio = new AudioManager();
