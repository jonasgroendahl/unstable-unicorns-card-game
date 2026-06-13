import { SKIN, FACE, baby, frame, at, sparkles } from "../kit.mjs";

// Babies: small round hedgelets, each color-themed with one tiny prop/topper.
// Palettes are [top, bottom, glow] per baby.

const ink = SKIN.ink;

export const BABIES = {
  "baby-narwhal": frame({
    top: "#1d6f86",
    bottom: "#0b2c3a",
    glow: "#cdeefb",
    accents: sparkles(
      [
        [110, 110, 5],
        [400, 130, 4],
        [410, 290, 4],
      ],
      "#cdeefb",
    ),
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#2f5f72", body: "#dfe9ec", belly: "#f1f7f9" }), { s: 1 })}
      <!-- little tusk + water spout -->
      <path d="M196 150q6-46 -2-78q26 26 22 74Z" fill="#f4f8fb" stroke="${ink}" stroke-width="3"/>
      <g transform="translate(196 70)" fill="none" stroke="#7fd0ec" stroke-width="6" stroke-linecap="round"><path d="M0 0q-14-20 4-34M0 0q14-18 -2-36"/></g>`,
  }),

  "baby-unicorn-black": frame({
    top: "#2c2740",
    bottom: "#100d1c",
    glow: "#b6a8e0",
    accents: sparkles(
      [
        [110, 100, 4],
        [380, 120, 5],
        [410, 280, 4],
        [120, 300, 4],
      ],
      "#cfc4f0",
    ),
    scene: `${at(baby({ face: FACE.sleepy(), spine: "#2a2438", body: "#5b5570", belly: "#6f6889" }), {})}
      <!-- crescent moon + zzz -->
      <path d="M196 110a26 26 0 1 0 12 24 20 20 0 0 1-12-24Z" fill="#ffe27b"/>
      <text x="300" y="150" font-family="Arial" font-size="34" font-weight="700" fill="#cfc4f0">z</text>
      <text x="330" y="125" font-family="Arial" font-size="26" font-weight="700" fill="#cfc4f0">z</text>`,
  }),

  "baby-unicorn-blue": frame({
    top: "#2a5a9c",
    bottom: "#11233f",
    glow: "#bcd8ff",
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#274a7e", body: "#9cc0f0", belly: "#c4dbfa" }), {})}
      <!-- holding a blueberry -->
      <circle cx="316" cy="250" r="26" fill="#3f5fb0"/><circle cx="309" cy="243" r="7" fill="#8aa6e8" opacity=".7"/>
      <path d="M316 224q-4-12 8-14" fill="none" stroke="#3a7a3a" stroke-width="4"/>`,
  }),

  "baby-unicorn-brown": frame({
    top: "#6e4a2c",
    bottom: "#2c1c11",
    glow: "#f3d9a8",
    scene: `${at(baby({ face: FACE.smile({ y: 1 }), spine: "#4a3320", body: "#c79a6a", belly: "#dcb789" }), {})}
      <!-- acorn cap topper -->
      <g transform="translate(196 112)"><path d="M-34 4c0-30 68-30 68 0Z" fill="#7a5230"/><path d="M-30 4h60c0 40-60 40-60 0Z" fill="#a9743f"/><path d="M0-26v-12" stroke="#5a3c22" stroke-width="6" stroke-linecap="round"/></g>`,
  }),

  "baby-unicorn-death": frame({
    top: "#33323e",
    bottom: "#121117",
    glow: "#9aa6b4",
    accents: sparkles(
      [
        [120, 300, 4],
        [380, 300, 4],
      ],
      "#9aa6b4",
    ),
    scene: `${at(baby({ face: FACE.dead(), spine: "#2b2a36", body: "#8c8c98", belly: "#a3a3ad" }), {})}
      <!-- tiny grim-reaper hood + scythe -->
      <path d="M120 150c-6-60 80-92 116-44-30-12-92-2-90 60Z" fill="#2b2a36" opacity=".85"/>
      <g transform="translate(330 150)"><path d="M0-40v120" stroke="#6a5238" stroke-width="6"/><path d="M0-40q40 2 44 34-30-16-44-10Z" fill="#cfd6df" stroke="${ink}" stroke-width="2"/></g>`,
  }),

  "baby-unicorn-green": frame({
    top: "#2f7a47",
    bottom: "#123020",
    glow: "#bdf0c8",
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#2a5e39", body: "#8fd49a", belly: "#bdeac5" }), {})}
      <!-- leaf sprout on head -->
      <g transform="translate(196 118)"><path d="M0 0c-2-30-28-34-44-26 6 24 24 32 44 26Z" fill="#5fb56e" stroke="${ink}" stroke-width="2"/><path d="M0 0c2-30 28-34 44-26-6 24-24 32-44 26Z" fill="#74c982" stroke="${ink}" stroke-width="2"/><path d="M0 6v18" stroke="#3a6b44" stroke-width="5"/></g>`,
  }),

  "baby-unicorn-orange": frame({
    top: "#b35d22",
    bottom: "#3f2110",
    glow: "#ffd49a",
    scene: `${at(baby({ face: FACE.smile({ y: 1 }), spine: "#7a3f16", body: "#f0a85c", belly: "#f8c98c" }), {})}
      <!-- pumpkin buddy -->
      <g transform="translate(316 256)"><ellipse rx="34" ry="28" fill="#e8772a"/><path d="M-34 0h68M-16-26c-10 16-10 36 0 52M16-26c10 16 10 36 0 52" stroke="#b8551a" stroke-width="4" fill="none"/><path d="M0-28v-12" stroke="#3a6b44" stroke-width="6"/></g>`,
  }),

  "baby-unicorn-pink": frame({
    top: "#c44b86",
    bottom: "#3f1428",
    glow: "#ffd2ec",
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#9c3a68", body: "#f2a8cc", belly: "#fbcde2" }), {})}
      <!-- bow topper + bubblegum bubble -->
      <g transform="translate(196 116)"><path d="M-6 0C-46-30-52 22-10 12M6 0c40-30 46 22 10 12" fill="#ff7ab0" stroke="${ink}" stroke-width="2.5"/><circle r="8" fill="#e85b96"/></g>
      <circle cx="300" cy="244" r="22" fill="#ff9ec8" opacity=".85" stroke="${ink}" stroke-width="2"/>`,
  }),

  "baby-unicorn-purple": frame({
    top: "#5a3a8e",
    bottom: "#211238",
    glow: "#dcc6ff",
    accents: sparkles(
      [
        [120, 110, 4],
        [390, 130, 5],
        [400, 290, 4],
      ],
      "#dcc6ff",
    ),
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#4a2f74", body: "#bda2ec", belly: "#d6c2f5" }), {})}
      <!-- floating crystal -->
      <g transform="translate(316 240)"><path d="M0-30 20-8 10 28h-20L-20-8Z" fill="#b98cf0" stroke="${ink}" stroke-width="2.5"/><path d="M0-30v58M-20-8 0 0 20-8" fill="none" stroke="#e8d8ff" stroke-width="2" opacity=".8"/></g>`,
  }),

  "baby-unicorn-rainbow": frame({
    top: "#3a6f8f",
    bottom: "#14303f",
    glow: "#e2f7ff",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 4],
        [402, 296, 3],
      ],
      "#fff",
    ),
    scene: `${at(baby({ face: FACE.love(), spine: "#34596a", body: "#f2d8b2", belly: "#fbe9cf" }), {})}
      <!-- rainbow tuft -->
      <g transform="translate(196 120)" fill="none" stroke-width="9" stroke-linecap="round"><path d="M-34 0a34 34 0 0 1 68 0" stroke="#ff6b6b"/><path d="M-20 0a20 20 0 0 1 40 0" stroke="#ffe27b"/></g>`,
  }),

  "baby-unicorn-red": frame({
    top: "#a83232",
    bottom: "#3a1010",
    glow: "#ffc0a8",
    accents: sparkles(
      [
        [330, 110, 6],
        [360, 90, 4],
        [300, 95, 4],
      ],
      "#ffd86a",
    ),
    scene: `${at(baby({ face: FACE.surprised({ y: 1 }), spine: "#7a2222", body: "#ef8170", belly: "#f7a896" }), {})}
      <!-- firecracker spark fuse -->
      <g transform="translate(316 230)"><rect x="-10" y="-6" width="20" height="46" rx="5" fill="#d94545"/><path d="M0-6q10-22 22-20" fill="none" stroke="#5a3c22" stroke-width="4"/></g>
      <path d="M340 196l5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="#ffe27b"/>`,
  }),

  "baby-unicorn-white": frame({
    top: "#5b76a0",
    bottom: "#1f2c44",
    glow: "#eaf4ff",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 5],
        [120, 300, 4],
        [400, 290, 4],
      ],
      "#fff",
    ),
    scene: `${at(baby({ face: FACE.happy({ y: 1 }), spine: "#7e8aa0", body: "#f4f6fb", belly: "#ffffff" }), {})}
      <!-- snowflake topper -->
      <g transform="translate(196 110)" stroke="#bcd8ff" stroke-width="5" stroke-linecap="round"><path d="M0-22V22M-19-11 19 11M-19 11 19-11"/></g>`,
  }),

  "baby-unicorn-yellow": frame({
    top: "#c79a1e",
    bottom: "#403010",
    glow: "#fff0a8",
    accents: `<g stroke="#ffe27b" stroke-width="6" stroke-linecap="round" opacity=".7"><path d="M196 60v-26M150 86 130 70M242 86l20-16"/></g>`,
    scene: `${at(baby({ face: FACE.smile({ y: 1 }), spine: "#9c7416", body: "#f6dd6a", belly: "#fbeca0" }), {})}
      <!-- little sun buddy -->
      <g transform="translate(322 240)"><circle r="22" fill="#ffd24a" stroke="${ink}" stroke-width="2"/><g stroke="#ffd24a" stroke-width="5" stroke-linecap="round"><path d="M0-32v-8M0 32v8M-32 0h-8M32 0h8M-23-23l-6-6M23 23l6 6M23-23l6-6M-23 23l-6 6"/></g></g>`,
  }),
};
