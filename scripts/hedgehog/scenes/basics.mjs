import { SKIN, FACE, body, paw, frame, at, sparkles } from "../kit.mjs";

// Basic "everyday hedgehogs" — each a little character with a personality prop.
const ink = SKIN.ink;

export const BASICS = {
  // Bearded Bert (red)
  "basic-unicorn-red": frame({
    top: "#a13a36",
    bottom: "#371311",
    glow: "#ffc7a6",
    scene: `${at(body({ face: FACE.smug(), spine: "#7a2a26", body: "#ef8a72" }), {})}
      <!-- bushy beard under snout -->
      <path d="M250 286c20 10 44 12 70 2 8 40-12 70-36 70s-44-30-34-72Z" fill="#7a4a30"/>
      <path d="M256 292q34 12 64 0" fill="none" stroke="#5e3622" stroke-width="3"/>`,
  }),

  // Pumpkin Pip (orange) — coffee in paw
  "basic-unicorn-orange": frame({
    top: "#b25e23",
    bottom: "#3f2410",
    glow: "#ffd9a0",
    scene: `${at(body({ face: FACE.sleepy(), spine: "#7d3f17", body: "#f0a85c" }), {})}
      <g transform="translate(322 252)"><path d="M-28-18h48v34a18 18 0 0 1-18 18h-12a18 18 0 0 1-18-18Z" fill="#f4f0e8" stroke="${ink}" stroke-width="3"/><path d="M20-10h10a13 13 0 0 1 0 26h-10" fill="none" stroke="${ink}" stroke-width="3"/><path d="M-14-30q-4-10 4-16M2-30q-4-10 4-16" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/></g>
      ${paw(300, 250, { dir: 1, r: 14 })}`,
  }),

  // Disco Daisy (yellow) — disco ball + dance
  "basic-unicorn-yellow": frame({
    top: "#3a2c5e",
    bottom: "#15102a",
    glow: "#ffe9a0",
    accents: sparkles([
      [110, 110, 5, "#ff7ad1"],
      [392, 120, 5, "#7be0ff"],
      [400, 300, 4, "#ffe27b"],
      [120, 300, 4, "#7be08e"],
    ]),
    scene: `${at(body({ face: FACE.happy(), spine: "#9c7416", body: "#f6dd6a" }), { rot: -6 })}
      <g transform="translate(330 120)"><path d="M0-34v14" stroke="#8a8aa0" stroke-width="3"/><circle r="28" fill="#cfd6e8" stroke="${ink}" stroke-width="2"/><path d="M-24-10h48M-26 8h52M-12-24v52M12-24v52" stroke="#9aa6c8" stroke-width="2" opacity=".7"/></g>`,
  }),

  // Vinyl Vera (green) — vinyl record
  "basic-unicorn-green": frame({
    top: "#2f7048",
    bottom: "#123020",
    glow: "#bff0cf",
    scene: `${at(body({ face: FACE.cool(), spine: "#2a5836", body: "#7fce93" }), {})}
      <g transform="translate(326 232)"><circle r="40" fill="#1c1c24"/><circle r="14" fill="#e85b96"/><circle r="3" fill="#1c1c24"/><circle r="40" fill="none" stroke="#3a3a46" stroke-width="1.5"/><circle r="30" fill="none" stroke="#3a3a46" stroke-width="1.5"/></g>`,
  }),

  // Denim Darren (blue) — chunky glasses
  "basic-unicorn-blue": frame({
    top: "#2d5a9a",
    bottom: "#112340",
    glow: "#bcd6ff",
    scene: `${at(body({ face: FACE.happy(), spine: "#264a7e", body: "#8fb6ee" }), {})}
      <!-- nerd glasses over the eyes -->
      <g transform="translate(322 270)" fill="none" stroke="${ink}" stroke-width="5"><circle cx="-18" r="17" fill="#cfe0ff" fill-opacity=".35"/><circle cx="18" r="17" fill="#cfe0ff" fill-opacity=".35"/><path d="M-1 0h2"/><path d="M35 0q12-2 20 6" /></g>`,
  }),

  // Emoji Edie (indigo) — smartphone
  "basic-unicorn-indigo": frame({
    top: "#3a3a8e",
    bottom: "#141438",
    glow: "#c6c6ff",
    scene: `${at(body({ face: FACE.happy({ y: 1 }), spine: "#2c2c6e", body: "#9a9aea" }), {})}
      <g transform="translate(322 236) rotate(8)"><rect x="-26" y="-42" width="52" height="84" rx="10" fill="#1c1c2c"/><rect x="-20" y="-32" width="40" height="58" rx="4" fill="#ffd24a"/><path d="M-10-16q10 12 20 0" stroke="${ink}" stroke-width="3" fill="none"/><circle cx="-7" cy="-22" r="3" fill="${ink}"/><circle cx="7" cy="-22" r="3" fill="${ink}"/></g>`,
  }),

  // Selfie Sylvie (purple) — camera + flash
  "basic-unicorn-purple": frame({
    top: "#5a3a8e",
    bottom: "#221238",
    glow: "#dcc6ff",
    accents: sparkles(
      [
        [360, 96, 7],
        [388, 120, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.wink(), spine: "#472d70", body: "#bda2ec" }), {})}
      <g transform="translate(326 232)"><rect x="-40" y="-26" width="80" height="54" rx="10" fill="#2b2330"/><path d="M-24-26l8-12h32l8 12Z" fill="#2b2330"/><circle r="18" fill="#5a6b8c"/><circle r="9" fill="#cfe0ff"/><rect x="22" y="-20" width="12" height="6" rx="2" fill="#ffe27b"/></g>`,
  }),

  // Pointy Porcupine (Narwhal as basic) — extra spiky, proud tusk
  narwhal: frame({
    top: "#2a6a7c",
    bottom: "#0e2a33",
    glow: "#cdeef5",
    scene: `${at(body({ face: FACE.determined(), spine: "#23525f", body: "#bfe2ea", belly: "#dcf1f5" }), {})}
      <!-- forehead tusk -->
      <path d="M196 150q8-58 -4-96q30 30 26 92Z" fill="#eef8fb" stroke="${ink}" stroke-width="3"/>
      <path d="M186 70q4-30 8-44" stroke="#bcd8e0" stroke-width="3" fill="none"/>`,
  }),
};
