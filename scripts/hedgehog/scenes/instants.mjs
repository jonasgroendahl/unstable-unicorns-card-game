import { SKIN, FACE, body, frame, at, sparkles } from "../kit.mjs";

// Instants ("Interruptions") — the reaction cards. Bold STOP energy.
const ink = SKIN.ink;

export const INSTANTS = {
  // Nope! (Neigh) — scowling, throwing up a big NOPE paw-sign
  neigh: frame({
    top: "#3a2330",
    bottom: "#160d14",
    glow: "#ffb4b4",
    scene: `${at(body({ face: FACE.angry(), spine: "#4a2f3a", body: "#e89292" }), { x: 280 })}
      <g transform="translate(150 205)"><circle r="60" fill="#ec4d4d" stroke="#fff" stroke-width="7"/><circle r="60" fill="none" stroke="${ink}" stroke-width="5"/><text x="0" y="13" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#fff" text-anchor="middle">NOPE</text></g>`,
  }),

  // Absolutely Nope! (Super Neigh) — furious, double STOP, dramatic
  "super-neigh": frame({
    top: "#4a1820",
    bottom: "#1c080c",
    glow: "#ff9a9a",
    accents: `<g stroke="#ff6b6b" stroke-width="5" stroke-linecap="round" opacity=".55"><path d="M60 120l-30-16M70 300l-34 8M440 120l30-16M430 300l34 8"/></g>`,
    scene: `${at(body({ face: FACE.manic(), spine: "#3a1218", body: "#e87a7a" }), { x: 280, rot: -3 })}
      <g transform="translate(150 200)"><path d="M-44-72 44-72 72-44 72 44 44 72-44 72-72 44-72-44Z" fill="#d62828" stroke="#fff" stroke-width="7"/><path d="M-44-72 44-72 72-44 72 44 44 72-44 72-72 44-72-44Z" fill="none" stroke="${ink}" stroke-width="4"/><text x="0" y="-2" font-family="Arial Black, Arial, sans-serif" font-size="26" font-weight="900" fill="#fff" text-anchor="middle">SUPER</text><text x="0" y="26" font-family="Arial Black, Arial, sans-serif" font-size="26" font-weight="900" fill="#fff" text-anchor="middle">NOPE</text></g>
      ${sparkles(
        [
          [400, 120, 8],
          [380, 300, 6],
        ],
        "#ffd24a",
      )}`,
  }),
};
