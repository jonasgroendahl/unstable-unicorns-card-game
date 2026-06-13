import { SKIN, FACE, body, paw, frame, at, sparkles } from "../kit.mjs";

// Downgrades ("Bad Ideas") — afflictions; darker, troubled palettes.
const ink = SKIN.ink;

export const DOWNGRADES = {
  // Bramble Trouble (Barbed Wire) — tangled in barbed wire, wincing
  "barbed-wire": frame({
    top: "#4a3a2a",
    bottom: "#1c1610",
    glow: "#d8c0a0",
    scene: `${at(body({ face: FACE.scared(), spine: "#3a2e20", body: "#c2a474" }), {})}
      <!-- barbed wire across -->
      <g stroke="#8a8a96" stroke-width="3" fill="none"><path d="M40 250q100-30 200 0t220 0"/></g>
      <g stroke="#8a8a96" stroke-width="3"><path d="M110 244l-8-12 16 4M110 244l8-12-16 4M250 250l-8-12 16 4M250 250l8-12-16 4M390 246l-8-12 16 4M390 246l8-12-16 4"/></g>`,
  }),

  // High-Beam Havoc (Blinding Light) — squinting in a harsh spotlight
  "blinding-light": frame({
    top: "#7a6a2a",
    bottom: "#2c2610",
    glow: "#fff4b0",
    accents: `<path d="M250 0L80 240h340Z" fill="#fff4b0" opacity=".45"/>`,
    scene: `${at(body({ face: FACE.scared(), spine: "#5a4e1e", body: "#e8d27a" }), {})}
      <!-- shielding paw + glare -->
      ${paw(300, 180, { r: 15 })}
      ${sparkles([[260, 120, 16, "#fffce0"]])}`,
  }),

  // Collapsed Burrow (Broken Stable) — rubble, broken roof
  "broken-stable": frame({
    top: "#4a3a3a",
    bottom: "#1c1414",
    glow: "#d8b0a0",
    scene: `${at(body({ face: FACE.sleepy(), spine: "#3a2e2e", body: "#c2948a" }), { y: 245 })}
      <!-- broken roof beams + crack -->
      <path d="M120 150l60 80M360 140l-50 90" stroke="#6a4a3a" stroke-width="12" stroke-linecap="round"/>
      <path d="M250 70l-12 40 16 8-10 36" fill="none" stroke="#ffce6a" stroke-width="4"/>
      <g fill="#5a4038"><path d="M120 350l30-30 24 30ZM330 352l28-26 22 26Z"/></g>`,
  }),

  // Burrowcam (Nanny Cam) — security camera watching, nervous
  "nanny-cam": frame({
    top: "#2a3a4a",
    bottom: "#10181c",
    glow: "#aaccdc",
    scene: `${at(body({ face: FACE.scared(), spine: "#243038", body: "#8aa6b4" }), {})}
      <!-- CCTV camera watching from corner -->
      <g transform="translate(360 120) rotate(18)"><rect x="-44" y="-16" width="80" height="32" rx="10" fill="#3a4650"/><circle cx="34" cy="0" r="12" fill="#1c2228"/><circle cx="34" cy="0" r="5" fill="#ff5b5b"/><path d="M-44 0h-20v-22" stroke="#3a4650" stroke-width="6" fill="none"/></g>
      <path d="M386 132l-70 70" stroke="#ff5b5b" stroke-width="2" opacity=".4"/>`,
  }),

  // Panda Prickle Party (Pandamonium) — wearing a panda costume
  pandamonium: frame({
    top: "#3a3a44",
    bottom: "#16161c",
    glow: "#e8e8ee",
    scene: `${at(body({ face: FACE.happy(), spine: "#2c2c34", body: "#f0f0f4", belly: "#ffffff" }), {})}
      <!-- panda eye patches + ears -->
      <ellipse cx="300" cy="262" rx="20" ry="26" fill="#2b2330" transform="rotate(-12 300 262)"/>
      <ellipse cx="350" cy="266" rx="20" ry="26" fill="#2b2330" transform="rotate(12 350 266)"/>
      <circle cx="305" cy="262" r="6" fill="#fff"/><circle cx="346" cy="266" r="6" fill="#fff"/>
      <circle cx="170" cy="130" r="26" fill="#2b2330"/><circle cx="250" cy="120" r="26" fill="#2b2330"/>`,
  }),

  // Grim Grooming (Sadistic Ritual) — ominous candle + dark mood
  "sadistic-ritual": frame({
    top: "#3a1e2a",
    bottom: "#160a10",
    glow: "#d88a9a",
    accents: sparkles([[392, 120, 4]], "#ffae8a"),
    scene: `${at(body({ face: FACE.angry(), spine: "#2c1620", body: "#b86a7a" }), { x: 220 })}
      <!-- ritual candle -->
      <g transform="translate(346 250)"><rect x="-14" y="-10" width="28" height="56" rx="6" fill="#e8d2b0" stroke="${ink}" stroke-width="2"/><path d="M0-12c-14-12-2-26 0-36 12 14 14 26 0 36Z" fill="#ff9a3c"/><path d="M0-22c-7-6-1-13 0-18 6 7 7 13 0 18Z" fill="#ffe27b"/></g>
      <g fill="#d88a9a" opacity=".6">${sparkles([
        [120, 150, 5],
        [140, 300, 4],
      ])}</g>`,
  }),

  // Molasses Mode (Slowdown) — snail-paced, sleepy, dripping slow
  slowdown: frame({
    top: "#3a4a3a",
    bottom: "#141c14",
    glow: "#bcd8a8",
    scene: `${at(body({ face: FACE.sleepy(), spine: "#2c382c", body: "#a8c08a" }), {})}
      <!-- snail riding along -->
      <g transform="translate(140 320)"><path d="M-30 10h50" stroke="#8a6a4a" stroke-width="10" stroke-linecap="round"/><circle cx="6" cy="-8" r="20" fill="#c79a6a" stroke="${ink}" stroke-width="2"/><path d="M6-8a10 10 0 1 1 -6 -8" fill="none" stroke="#8a6a4a" stroke-width="3"/><path d="M-26 0l-6-12M-20 0l-2-14" stroke="#8a6a4a" stroke-width="2"/></g>
      <text x="320" y="160" font-family="Arial" font-size="30" fill="#bcd8a8" opacity=".7">z</text>`,
  }),

  // Pocket Burrow (Tiny Stable) — cramped in a tiny house, squished
  "tiny-stable": frame({
    top: "#3a3a5a",
    bottom: "#141422",
    glow: "#c0c0e0",
    scene: `<!-- tiny house outline too small for the hog -->
      <path d="M170 360v-90l80-50 80 50v90Z" fill="none" stroke="#9a9ac8" stroke-width="6"/>
      <path d="M158 280l92-58 92 58" fill="none" stroke="#9a9ac8" stroke-width="6"/>
      ${at(body({ face: FACE.scared(), spine: "#2c2c4a", body: "#a0a0d4" }), { y: 290, s: 0.78 })}`,
  }),
};
