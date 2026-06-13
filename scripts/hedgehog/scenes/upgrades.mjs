import { SKIN, FACE, body, paw, frame, at, sparkles } from "../kit.mjs";

// Upgrades ("Bright Ideas") — positive boosts, bright cheerful palettes.
const ink = SKIN.ink;

export const UPGRADES = {
  // Double Trouble (Double Dutch) — jump rope, two ropes spinning
  "double-dutch": frame({
    top: "#2a6a7a",
    bottom: "#0e2830",
    glow: "#bff0ff",
    scene: `${at(body({ face: FACE.happy(), spine: "#234a54", body: "#7ec8d0" }), { y: 230 })}
      <g fill="none" stroke="#ffd24a" stroke-width="6" stroke-linecap="round"><path d="M120 110q130 200 260 0"/><path d="M150 110q100 240 200 0"/></g>
      <g stroke="#ff7a8a" stroke-width="2" opacity=".5"><path d="M120 300l-14 14M380 300l14 14"/></g>`,
  }),

  // Bonus Bristles (Extra Tail) — proud big bushy tail
  "extra-tail": frame({
    top: "#7a5a2a",
    bottom: "#2c2010",
    glow: "#ffe0a0",
    scene: `<!-- giant fluffy tail, drawn behind/left of the body so it's visible -->
      <g transform="translate(118 250)"><path d="M0 60q-90-2 -96-86q12 46 56 36 -48-26 -16-78q18 42 60 30 -42-30 -2-78q14 48 64 44Z" fill="#d8a850" stroke="${ink}" stroke-width="3"/><path d="M-30 0q-30 0 -40-30M-10-44q-26-6 -30-36" fill="none" stroke="#b8843a" stroke-width="2" opacity=".6"/></g>
      ${at(body({ face: FACE.smug(), spine: "#5a4220", body: "#e8c078" }), { x: 290 })}`,
  }),

  // Confetti Catastrophe (Glitter Bomb) — startled, bursting glitter bomb
  "glitter-bomb": frame({
    top: "#5a2c52",
    bottom: "#1c0f1f",
    glow: "#ffd1f0",
    accents: sparkles([
      [100, 100, 6, "#ff7ad1"],
      [410, 120, 5, "#7be0ff"],
      [380, 300, 6, "#ffe27b"],
      [120, 300, 5, "#7be08e"],
    ]),
    scene: `${at(body({ face: FACE.surprised({ x: 2 }), spine: "#5a3a52" }), { x: 215, rot: 3 })}
      <g transform="translate(330 175)"><circle r="46" fill="#2b2330"/><circle cx="-14" cy="-14" r="12" fill="#5a4a52"/><path d="M30-34c14-16 4-34 22-44" fill="none" stroke="#2b2330" stroke-width="6"/><g stroke-width="8" stroke-linecap="round"><path d="M40-40l40-40" stroke="#ff7ad1"/><path d="M52-10l54-8" stroke="#ffe27b"/><path d="M40 30l46 30" stroke="#7be0ff"/><path d="M8 46l8 56" stroke="#7be08e"/><path d="M-30 40l-40 38" stroke="#ff9a5c"/></g></g>`,
  }),

  // Spectrum Shield (Rainbow Aura) — protective rainbow bubble
  "rainbow-aura": frame({
    top: "#2a4a8e",
    bottom: "#101e3c",
    glow: "#cfe0ff",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.happy({ y: -1 }), spine: "#243a6e", body: "#9ab0e8" }), {})}
      <!-- concentric rainbow shield rings -->
      <g fill="none" opacity=".55"><circle cx="250" cy="235" r="150" stroke="#ff6b6b" stroke-width="6"/><circle cx="250" cy="235" r="160" stroke="#ffd24a" stroke-width="6"/><circle cx="250" cy="235" r="170" stroke="#7be08e" stroke-width="6"/><circle cx="250" cy="235" r="180" stroke="#5fb0ff" stroke-width="6"/></g>`,
  }),

  // Technicolor Tuft (Rainbow Mane) — flowing rainbow mane/hair
  "rainbow-mane": frame({
    top: "#3a2c6a",
    bottom: "#15102c",
    glow: "#e6d6ff",
    scene: `${at(body({ face: FACE.happy(), spine: "#2c245a", body: "#b6a2e8" }), { x: 270 })}
      <!-- rainbow mane streaming back over quills -->
      <g fill="none" stroke-width="11" stroke-linecap="round"><path d="M150 150q-90 20 -110 90" stroke="#ff6b6b"/><path d="M165 165q-90 26 -104 96" stroke="#ffb24a"/><path d="M182 182q-86 30 -96 100" stroke="#ffe27b"/><path d="M200 200q-80 32 -86 104" stroke="#7be08e"/><path d="M220 220q-74 34 -76 108" stroke="#5fb0ff"/></g>`,
  }),

  // Circle of Quills (Summoning Ritual) — magic circle, candles
  "summoning-ritual": frame({
    top: "#2c2c6a",
    bottom: "#10102c",
    glow: "#c6b8ff",
    accents: sparkles(
      [
        [110, 120, 5],
        [392, 120, 5],
        [400, 300, 4],
        [120, 300, 4],
      ],
      "#ffe27b",
    ),
    scene: `<!-- glowing pentagram circle on the ground -->
      <ellipse cx="250" cy="340" rx="170" ry="44" fill="none" stroke="#9a7aff" stroke-width="4" opacity=".7"/>
      <g transform="translate(250 332) scale(1 .28)" fill="none" stroke="#b89aff" stroke-width="4" opacity=".6"><path d="M0-120 71 96-114-37H114L-71 96Z"/></g>
      ${at(body({ face: FACE.manic(), spine: "#26265e", body: "#a89aec" }), { y: 225 })}
      <g fill="#ffce6a"><circle cx="120" cy="330" r="6"/><circle cx="380" cy="330" r="6"/></g>`,
  }),

  // Hedgehog Hook (Unicorn Lasso) — twirling a lasso
  "unicorn-lasso": frame({
    top: "#7a5a2a",
    bottom: "#2c2010",
    glow: "#ffe0a0",
    scene: `${at(body({ face: FACE.determined(), spine: "#5a4220", body: "#e8b86a" }), {})}
      <!-- spinning lasso loop overhead -->
      <ellipse cx="300" cy="110" rx="80" ry="28" fill="none" stroke="#c9a14a" stroke-width="7"/>
      <path d="M300 138q20 60 36 80" fill="none" stroke="#c9a14a" stroke-width="7"/>
      ${paw(330, 200, { r: 14 })}`,
  }),

  // Heck Yes! (Yay) — jubilant, confetti + party
  yay: frame({
    top: "#7a4a1e",
    bottom: "#2c1c0c",
    glow: "#ffe6a0",
    accents: sparkles([
      [100, 100, 6, "#ff7ad1"],
      [410, 110, 6, "#7be0ff"],
      [380, 300, 5, "#ffe27b"],
      [120, 300, 5, "#7be08e"],
    ]),
    scene: `${at(body({ face: FACE.manic({ y: -2 }), spine: "#5a3414", body: "#f0c05a" }), {})}
      <!-- raised cheering paws -->
      ${paw(150, 170, { dir: -1, r: 16 })}${paw(352, 165, { dir: 1, r: 16 })}
      <g stroke-width="6" stroke-linecap="round"><path d="M150 150l-12-20" stroke="#ff7ad1"/><path d="M352 145l14-20" stroke="#7be0ff"/></g>`,
  }),
};
