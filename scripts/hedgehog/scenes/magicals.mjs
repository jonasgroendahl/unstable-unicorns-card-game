import { SKIN, FACE, body, paw, wing, frame, at, sparkles } from "../kit.mjs";

// Magical "Unhinged Hedgehogs" — the showpiece characters. Each does the thing
// its card is about. Split across two files (magicals + magicals2).
const ink = SKIN.ink;

export const MAGICALS = {
  // Beguiling Bristle (Alluring Narwhal) — hypnotic charm, tusk + heart eyes
  "alluring-narwhal": frame({
    top: "#7a2a64",
    bottom: "#2a0e26",
    glow: "#ffb8e6",
    accents: sparkles(
      [
        [110, 120, 5],
        [392, 130, 5],
        [400, 300, 4],
        [120, 300, 4],
      ],
      "#ffc8ee",
    ),
    scene: `${at(body({ face: FACE.love(), spine: "#5e2050", body: "#e6a8d2", belly: "#f6d2ec" }), {})}
      <path d="M196 150q8-58 -4-96q30 30 26 92Z" fill="#f6e4f2" stroke="${ink}" stroke-width="3"/>
      <g fill="#ff8ac8"><path d="M300 150c-8-10-22 0-12 11l12 11 12-11c10-11-4-21-12-11Z"/><path d="M348 196c-6-8-17 0-9 9l9 8 9-8c8-9-3-17-9-9Z"/></g>`,
  }),

  // Star-Spangled Spiker (Americorn) — patriotic, star shades + cape
  americorn: frame({
    top: "#1f3a78",
    bottom: "#0e1838",
    glow: "#e6ecff",
    accents: sparkles([
      [110, 110, 6, "#ff6b6b"],
      [392, 120, 6, "#fff"],
      [400, 300, 5, "#6b8cff"],
      [120, 300, 5, "#fff"],
    ]),
    scene: `<path d="M150 250c80-30 150-30 220 0l-30 120H180Z" fill="#c8324a" opacity=".9"/>
      ${at(body({ face: FACE.cool(), spine: "#23386e", body: "#eef2ff", belly: "#ffffff" }), {})}
      <path d="M150 256h220" stroke="#fff" stroke-width="6"/>
      ${sparkles([[316, 232, 18, "#ffd24a"]])}`,
  }),

  // Halo Hedge (Angel Unicorn) — wings + halo, serene
  "angel-unicorn": frame({
    top: "#5b86c4",
    bottom: "#1c2c50",
    glow: "#fbf4d6",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 4],
        [120, 300, 4],
        [400, 300, 4],
      ],
      "#fff",
    ),
    scene: `${wing(150, 220, { side: "L", scale: 1.05 })}${wing(350, 220, { side: "R", scale: 1.05 })}
      ${at(body({ face: FACE.happy({ y: -1 }), spine: "#4a6fa8", body: "#f4f6fb", belly: "#ffffff" }), {})}
      <ellipse cx="186" cy="92" rx="56" ry="16" fill="none" stroke="#ffe27b" stroke-width="9"/>`,
  }),

  // Airborne Nuisance (Annoying Flying Unicorn) — wings + megaphone, smug
  "annoying-flying-unicorn": frame({
    top: "#9a6a1e",
    bottom: "#3a2810",
    glow: "#ffe6a0",
    accents: `<g stroke="#ffe27b" stroke-width="4" stroke-linecap="round" opacity=".7"><path d="M380 150l28-10M388 178l30 2M384 206l26 12"/></g>`,
    scene: `${wing(150, 210, { side: "L", scale: 0.9, fill: "#fce8b0", edge: "#e8c878" })}
      ${at(body({ face: FACE.manic(), spine: "#7a5418", body: "#f0c862" }), { rot: -4 })}
      <g transform="translate(330 200) rotate(8)"><path d="M0-22 56-40v80L0 22Z" fill="#e85b96" stroke="${ink}" stroke-width="3"/><rect x="-18" y="-22" width="22" height="44" rx="6" fill="#2b2330"/></g>
      ${paw(308, 232, { r: 13 })}`,
  }),

  // Midnight Sentinel (Black Knight) — helmet + shield, stoic
  "black-knight-unicorn": frame({
    top: "#2c3040",
    bottom: "#101218",
    glow: "#9fb4cc",
    scene: `${at(body({ face: FACE.determined(), spine: "#23252e", body: "#5c6470", belly: "#727a86" }), {})}
      <!-- knight helm -->
      <g transform="translate(196 96)"><path d="M-46-6c0-46 92-46 92 0v34H-46Z" fill="#8a93a4" stroke="${ink}" stroke-width="3"/><rect x="-46" y="18" width="92" height="12" fill="#6a7382"/><path d="M-30 0h60M-30 12h60" stroke="#2b2330" stroke-width="3"/><path d="M0-52c20 0 18 30 0 30" fill="#c8324a"/></g>
      <!-- shield in paw -->
      <g transform="translate(338 250)"><path d="M0-34 30-22v22c0 22-14 34-30 42-16-8-30-20-30-42v-22Z" fill="#6a7382" stroke="${ink}" stroke-width="3"/><path d="M0-30v66M-26-12h52" stroke="#2b2330" stroke-width="3"/></g>`,
  }),

  // Chainsaw Chester (Chainsaw Unicorn) — manic, chainsaw overhead
  "chainsaw-unicorn": frame({
    top: "#3a2a3f",
    bottom: "#160e1b",
    glow: "#ff8a5c",
    accents: `<g opacity=".55" stroke="#ffce6a" stroke-width="5" stroke-linecap="round"><path d="M360 70l28-24M398 92l32-12M392 140l34 6"/></g>`,
    scene: `${at(body({ face: FACE.manic({ y: -1 }), spine: "#4a3a2f" }), { x: 210, rot: -4 })}
      <g transform="translate(300 122) rotate(18)"><rect x="-30" y="-34" width="74" height="60" rx="14" fill="#b8392f"/><rect x="-18" y="-22" width="40" height="20" rx="6" fill="#2b2330"/><path d="M44-22h150l28 22-28 22H44Z" fill="#cfd6df" stroke="#2b2330" stroke-width="5"/><g fill="#2b2330"><path d="M70-30l10 8-10 8M110-30l10 8-10 8M150-30l10 8-10 8M190-30l8 8-8 8"/></g><path d="M-30 26q-22 6 -30 28" fill="none" stroke="#2b2330" stroke-width="9" stroke-linecap="round"/></g>
      ${paw(250, 196, { r: 19 })}`,
  }),

  // Dapper Quilliam (Classy Narwhal) — monocle, top hat, bowtie, tusk
  "classy-narwhal": frame({
    top: "#243a64",
    bottom: "#0e1830",
    glow: "#d6e2ff",
    accents: sparkles(
      [
        [392, 120, 4],
        [110, 300, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.smug(), spine: "#203258", body: "#c2d2ee", belly: "#dde7f8" }), {})}
      <path d="M196 150q6-50 -4-84q26 26 24 80Z" fill="#eef4ff" stroke="${ink}" stroke-width="3"/>
      <!-- top hat -->
      <g transform="translate(186 92)"><rect x="-54" y="6" width="108" height="12" rx="4" fill="#1c1c28"/><rect x="-34" y="-46" width="68" height="56" rx="6" fill="#23232e"/><rect x="-34" y="-8" width="68" height="10" fill="#c8324a"/></g>
      <!-- monocle on right eye -->
      <circle cx="338" cy="270" r="18" fill="none" stroke="#ffd24a" stroke-width="3"/><path d="M352 284l8 30" stroke="#ffd24a" stroke-width="3"/>
      <!-- bowtie -->
      <path d="M300 320l-22-12v24ZM300 320l22-12v24Z" fill="#c8324a" stroke="${ink}" stroke-width="2"/>`,
  }),

  // Wrecking Bristle (Extremely Destructive) — wrecking ball / explosion
  "extremely-destructive-unicorn": frame({
    top: "#7a3a1e",
    bottom: "#2c1408",
    glow: "#ffb16a",
    accents: `<g fill="#ffce6a" opacity=".8">${sparkles([
      [360, 110, 10],
      [120, 130, 6],
      [400, 290, 7],
    ])}</g>`,
    scene: `${at(body({ face: FACE.manic(), spine: "#5a2a14", body: "#e8895a" }), { x: 220 })}
      <!-- wrecking ball on chain -->
      <path d="M360 60l-30 90" stroke="#8a8a96" stroke-width="6"/>
      <circle cx="326" cy="172" r="44" fill="#3a3a46" stroke="${ink}" stroke-width="3"/><circle cx="312" cy="158" r="12" fill="#5a5a66" opacity=".7"/>
      <g stroke-width="8" stroke-linecap="round" opacity=".9"><path d="M326 130l8-30" stroke="#ffce6a"/><path d="M368 172l30-6" stroke="#ff8a5c"/><path d="M300 210l-10 28" stroke="#ffce6a"/></g>`,
  }),

  // Prolific Prickles (Extremely Fertile) — surrounded by hedgelets
  "extremely-fertile-unicorn": frame({
    top: "#2f7a47",
    bottom: "#123020",
    glow: "#c6f0d0",
    scene: `${at(body({ face: FACE.happy(), spine: "#2a5e39", body: "#86cf96" }), { y: 215, s: 0.95 })}
      <!-- two tiny hedgelet bumps -->
      <g transform="translate(140 330) scale(.4)"><path d="M-96 36C-96-58-24-104 36-92 116-76 116 24 92 70 64 122-96 130-96 36Z" fill="#2a5e39"/><ellipse cx="26" cy="34" rx="84" ry="72" fill="#86cf96"/><circle cx="60" cy="30" r="6" fill="${ink}"/><circle cx="100" cy="30" r="6" fill="${ink}"/></g>
      <g transform="translate(360 336) scale(-.36 .36)"><path d="M-96 36C-96-58-24-104 36-92 116-76 116 24 92 70 64 122-96 130-96 36Z" fill="#2a5e39"/><ellipse cx="26" cy="34" rx="84" ry="72" fill="#86cf96"/><circle cx="60" cy="30" r="6" fill="${ink}"/><circle cx="100" cy="30" r="6" fill="${ink}"/></g>
      ${sparkles(
        [
          [110, 120, 5],
          [392, 120, 5],
        ],
        "#fff",
      )}`,
  }),

  // Colossal Cuddler (Ginormous) — huge, fills the frame, tiny crown of stars
  "ginormous-unicorn": frame({
    top: "#3a4a8e",
    bottom: "#161e3c",
    glow: "#cdd6ff",
    scene: `${at(body({ face: FACE.happy(), spine: "#2c386e", body: "#9aa6ee" }), { x: 250, y: 240, s: 1.5 })}
      ${sparkles(
        [
          [120, 100, 7],
          [250, 70, 6],
          [388, 100, 7],
        ],
        "#ffe27b",
      )}`,
  }),

  // Sky-High Hoarder (Greedy Flying) — wings + bag of coins
  "greedy-flying-unicorn": frame({
    top: "#9a7a1e",
    bottom: "#3a2c10",
    glow: "#ffe6a0",
    accents: sparkles(
      [
        [110, 120, 5],
        [392, 130, 5],
      ],
      "#ffe27b",
    ),
    scene: `${wing(150, 210, { side: "L", scale: 0.9, fill: "#fce8b0", edge: "#e8c878" })}
      ${at(body({ face: FACE.smug(), spine: "#6e5418", body: "#f0d06a" }), {})}
      <!-- coin sack -->
      <g transform="translate(336 256)"><path d="M-34 0c-6-22 12-34 34-34s40 12 34 34c8 26-8 44-34 44s-42-18-34-44Z" fill="#c79a3a" stroke="${ink}" stroke-width="3"/><path d="M-18-30q18-10 36 0" fill="none" stroke="${ink}" stroke-width="3"/><text x="0" y="22" font-family="Arial" font-size="34" font-weight="900" fill="#7a5a18" text-anchor="middle">$</text></g>`,
  }),

  // Hedge-Llama Drama (Llamacorn) — long neck, llama ears, sassy
  llamacorn: frame({
    top: "#9a5a2a",
    bottom: "#3a2010",
    glow: "#ffd9a0",
    accents: sparkles(
      [
        [392, 120, 4],
        [110, 300, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.smug(), spine: "#7a4422", body: "#e8b878" }), {})}
      <!-- llama ears poking up -->
      <path d="M150 130q-10-44 14-58q14 30 4 60Z" fill="#e8b878" stroke="${ink}" stroke-width="2"/>
      <path d="M240 128q12-44 -10-60q-16 28 -6 62Z" fill="#e8b878" stroke="${ink}" stroke-width="2"/>
      <!-- saddle blanket -->
      <path d="M120 300h120l-12 50H132Z" fill="#c8324a"/><path d="M120 300h120" stroke="#ffd24a" stroke-width="4"/>`,
  }),
};
