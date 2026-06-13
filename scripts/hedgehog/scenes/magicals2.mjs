import { SKIN, FACE, body, paw, wing, frame, at, sparkles } from "../kit.mjs";

const ink = SKIN.ink;

export const MAGICALS2 = {
  // Arcane Aviator (Magical Flying) — wings + magic wand
  "magical-flying-unicorn": frame({
    top: "#3a2c74",
    bottom: "#14102e",
    glow: "#d6c6ff",
    accents: sparkles(
      [
        [110, 120, 5],
        [392, 120, 5],
        [400, 300, 4],
        [120, 300, 4],
      ],
      "#fff",
    ),
    scene: `${wing(150, 210, { side: "L", scale: 1, fill: "#e8dcff", edge: "#b9a6f0" })}
      ${at(body({ face: FACE.happy({ y: -1 }), spine: "#2e2460", body: "#b6a2ee" }), {})}
      <g transform="translate(338 150) rotate(28)"><path d="M0 0v96" stroke="#6a4a2a" stroke-width="8" stroke-linecap="round"/><g transform="translate(0 -6)">${sparkles(
        [
          [0, 0, 22, "#ffe27b"],
          [-18, 12, 8, "#fff"],
          [16, 14, 8, "#fff"],
        ],
      )}</g></g>`,
  }),

  // Kitten in Quills (Magical Kittencorn) — cat ears + whiskers
  "magical-kittencorn": frame({
    top: "#6a3a7a",
    bottom: "#241030",
    glow: "#f6c6ff",
    accents: sparkles(
      [
        [392, 120, 4],
        [110, 300, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.happy(), spine: "#52295e", body: "#e0a8e8" }), {})}
      <!-- cat ears -->
      <path d="M150 128l-16-52 46 28Z" fill="#e0a8e8" stroke="${ink}" stroke-width="2"/><path d="M142 92l-6-20 18 12Z" fill="#ff9ec8"/>
      <path d="M238 122l22-50 16 44Z" fill="#e0a8e8" stroke="${ink}" stroke-width="2"/><path d="M250 90l10-18 8 16Z" fill="#ff9ec8"/>
      <!-- whiskers -->
      <g stroke="${ink}" stroke-width="2.5" stroke-linecap="round" opacity=".7"><path d="M360 268q30-6 50-2M360 282q30 4 50 12"/></g>
      <!-- tail curl -->
      <path d="M120 320q-50 10 -40 -34" fill="none" stroke="#e0a8e8" stroke-width="16" stroke-linecap="round"/>`,
  }),

  // Regal Glider (Majestic Flying) — crown + big wings
  "majestic-flying-unicorn": frame({
    top: "#244a8e",
    bottom: "#0e1c3c",
    glow: "#dce6ff",
    accents: sparkles(
      [
        [110, 110, 5],
        [392, 120, 5],
      ],
      "#ffe27b",
    ),
    scene: `${wing(146, 205, { side: "L", scale: 1.15 })}${wing(354, 205, { side: "R", scale: 1.15 })}
      ${at(body({ face: FACE.smug(), spine: "#1f3c70", body: "#aebfe8" }), {})}
      <g transform="translate(186 92)"><path d="M-50-4 -26 20 0-30 26 20 50-4 38 56H-38Z" fill="#ffd24a" stroke="${ink}" stroke-width="3"/><circle cx="0" cy="-22" r="6" fill="#ff7a8a"/></g>`,
  }),

  // Mermaid Hedge (Mermaid Unicorn) — fish tail, shell bra, bubbles
  "mermaid-unicorn": frame({
    top: "#1f6a8e",
    bottom: "#0c2c3c",
    glow: "#bdeeff",
    accents: `<g fill="#bdeeff" opacity=".6"><circle cx="120" cy="120" r="8"/><circle cx="150" cy="160" r="5"/><circle cx="392" cy="130" r="7"/><circle cx="410" cy="180" r="4"/></g>`,
    scene: `${at(body({ face: FACE.love(), spine: "#1c5670", body: "#7ec8d8" }), { y: 220 })}
      <!-- scaly tail sweeping down/right -->
      <path d="M300 300q70 10 90 60 -20 50 -70 30 30-50 -20-90Z" fill="#3aa6c8" stroke="${ink}" stroke-width="3"/>
      <path d="M380 360q40-12 50 14M380 380q40 6 44 34" fill="#5cc0dc" stroke="${ink}" stroke-width="2"/>
      <g stroke="#2a8aa8" stroke-width="2" opacity=".6"><path d="M312 300q20 12 40 8M320 320q22 12 44 6"/></g>`,
  }),

  // Quill Torpedo (Narwhal Torpedo) — rocket-mounted, blasting forward
  "narwhal-torpedo": frame({
    top: "#7a3a2a",
    bottom: "#2a1008",
    glow: "#ffc08a",
    accents: `<g stroke="#ffce6a" stroke-width="6" stroke-linecap="round" opacity=".7"><path d="M70 220H10M90 250H30M80 282H20"/></g>`,
    scene: `<!-- flame trail -->
      <path d="M120 235q-70-4 -110 25 60 0 60 14 -60 0 -60 22 80-6 130-16Z" fill="#ff8a3c" opacity=".9"/>
      <path d="M120 245q-46-2 -74 16 40 0 40 8 -40 0 -40 14 54-4 86-10Z" fill="#ffd24a"/>
      ${at(body({ face: FACE.determined(), spine: "#5a281c", body: "#e69478" }), { x: 270, rot: -8 })}
      <path d="M450 218q-58 18 -78 12q12-30 78-12Z" fill="#eef4ff" stroke="${ink}" stroke-width="3"/>`,
  }),

  // Puppy-Prickle (Puppicorn) — floppy ears, tongue out, tail wag
  puppicorn: frame({
    top: "#9a6a2a",
    bottom: "#3a2410",
    glow: "#ffe0a8",
    scene: `${at(body({ face: FACE.manic(), spine: "#7a4a1e", body: "#e8c088" }), {})}
      <!-- floppy ears -->
      <path d="M150 130q-40 6 -34 70q34-10 42-64Z" fill="#a9743f" stroke="${ink}" stroke-width="2"/>
      <path d="M232 124q40 0 40 64q-34-6 -46-60Z" fill="#a9743f" stroke="${ink}" stroke-width="2"/>
      <!-- wagging tail -->
      <path d="M118 318q-46-2 -42 -44" fill="none" stroke="#e8c088" stroke-width="16" stroke-linecap="round"/>
      <g stroke="#fff" stroke-width="3" opacity=".5"><path d="M70 250l-12-8M64 270l-14 0"/></g>`,
  }),

  // Queen Bristle (Queen Bee) — crown + scepter, regal
  "queen-bee-unicorn": frame({
    top: "#3b2c63",
    bottom: "#170f2e",
    glow: "#ffe27b",
    accents: sparkles(
      [
        [90, 100, 4],
        [420, 120, 5],
        [380, 300, 4],
        [110, 320, 4],
      ],
      "#ffe27b",
    ),
    scene: `${at(body({ face: FACE.happy({ y: -1 }), spine: "#4a3a66" }), { y: 250 })}
      <g transform="translate(176 92)"><path d="M-58-6 -30 22 0-30 30 22 58-6 44 70H-44Z" fill="#ffd24a" stroke="${ink}" stroke-width="5"/><circle cx="-30" cy="-4" r="7" fill="#ff7a8a"/><circle cx="0" cy="-30" r="8" fill="#74d6ff"/><circle cx="30" cy="-4" r="7" fill="#7be08e"/><path d="M-44 54h88" stroke="${ink}" stroke-width="5"/></g>
      <g transform="translate(348 150) rotate(12)"><path d="M0 0v150" stroke="#c9a14a" stroke-width="10" stroke-linecap="round"/><circle cy="-8" r="16" fill="#ffe27b" stroke="${ink}" stroke-width="4"/></g>
      ${paw(338, 212, { r: 17 })}`,
  }),

  // Prism Prickles (Rainbow Unicorn) — full rainbow arc overhead
  "rainbow-unicorn": frame({
    top: "#1f5e8c",
    bottom: "#0c2740",
    glow: "#bfeaff",
    accents: sparkles(
      [
        [380, 90, 4],
        [120, 110, 3],
        [420, 250, 3],
      ],
      "#fff",
    ),
    scene: `<g fill="none" stroke-width="15" opacity=".9">
        <path d="M70 300C120 90 380 90 430 300" stroke="#ff6b6b"/><path d="M92 300C138 122 362 122 408 300" stroke="#ffb24a"/>
        <path d="M114 300C156 154 344 154 386 300" stroke="#ffe27b"/><path d="M136 300C174 186 326 186 364 300" stroke="#7be08e"/>
        <path d="M158 300C192 218 308 218 342 300" stroke="#5fb0ff"/></g>
      ${at(body({ face: FACE.love(), spine: "#2a4f74", body: "#f0d3ad" }), { y: 268, s: 0.92 })}`,
  }),

  // Rhino-Hedge Rampage (Rhinocorn) — big nose horn, charging
  rhinocorn: frame({
    top: "#5a5a64",
    bottom: "#1e1e26",
    glow: "#cdd0d8",
    accents: `<g stroke="#cdd0d8" stroke-width="4" stroke-linecap="round" opacity=".5"><path d="M70 250H20M86 282H30"/></g>`,
    scene: `${at(body({ face: FACE.angry(), spine: "#43434c", body: "#9aa0a8", belly: "#b4bac2" }), { x: 260, rot: 4 })}
      <!-- big horn on snout -->
      <path d="M430 250q-44 6 -58 -8q18-30 58 8Z" fill="#e6e2d6" stroke="${ink}" stroke-width="3"/>
      <!-- snort puffs -->
      <g fill="#fff" opacity=".55"><circle cx="452" cy="244" r="9"/><circle cx="468" cy="232" r="6"/></g>`,
  }),

  // Charming Charmer (Seductive Unicorn) — rose in mouth, wink
  "seductive-unicorn": frame({
    top: "#7a2040",
    bottom: "#2a0c18",
    glow: "#ffb8c8",
    accents: sparkles(
      [
        [392, 120, 4],
        [110, 300, 4],
      ],
      "#ffd2dc",
    ),
    scene: `${at(body({ face: FACE.wink(), spine: "#5e1a32", body: "#e88aa0" }), {})}
      <!-- rose held to snout -->
      <g transform="translate(346 268)"><circle r="18" fill="#d83a5a" stroke="${ink}" stroke-width="2"/><path d="M-6-6q6-8 12 0M-6 6q6 8 12 0" stroke="#a82844" stroke-width="2" fill="none"/><path d="M14 8q24 8 30 40" stroke="#3a8a4a" stroke-width="4" fill="none"/><path d="M30 30q14-4 22 4" stroke="#3a8a4a" stroke-width="4" fill="none"/></g>`,
  }),

  // Scruffy Quilliam (Shabby Narwhal) — scarf, patched, scruffy tusk
  "shabby-the-narwhal": frame({
    top: "#5a4a3a",
    bottom: "#221a14",
    glow: "#e8d6b8",
    scene: `${at(body({ face: FACE.sleepy(), spine: "#463728", body: "#c2a880", belly: "#d8c29c" }), {})}
      <path d="M196 150q4-44 -6-74q22 24 22 70Z" fill="#e8dcc4" stroke="${ink}" stroke-width="3"/>
      <path d="M180 90l8 6M186 110l6-4" stroke="#9a8460" stroke-width="2"/>
      <!-- knit scarf -->
      <path d="M236 300q40 24 88 8l8 26q-50 18 -104-6Z" fill="#b8543a" stroke="${ink}" stroke-width="2"/>
      <path d="M318 320l10 56M334 316l14 52" stroke="#b8543a" stroke-width="9" stroke-linecap="round"/>
      <g stroke="#8a3e2a" stroke-width="1.5" opacity=".6"><path d="M250 306v18M270 314v18M290 318v18"/></g>`,
  }),

  // Shark-Quill (Shark With a Horn) — dorsal fin, toothy
  "shark-with-a-horn": frame({
    top: "#1f5a74",
    bottom: "#0c242f",
    glow: "#bfe6f0",
    accents: `<g fill="#bfe6f0" opacity=".5"><circle cx="110" cy="120" r="6"/><circle cx="392" cy="140" r="5"/></g>`,
    scene: `${at(body({ face: FACE.angry(), spine: "#1c4a60", body: "#8ab8c8", belly: "#c2dde6" }), {})}
      <!-- horn -->
      <path d="M196 150q6-50 -4-82q26 26 24 80Z" fill="#eef6fa" stroke="${ink}" stroke-width="3"/>
      <!-- dorsal fin -->
      <path d="M120 250q40-60 70-58q-6 40 -30 64Z" fill="#5a8ea0" stroke="${ink}" stroke-width="3"/>
      <!-- teeth -->
      <path d="M300 296l8 12 8-12 8 12 8-12 8 12 8-12" fill="none" stroke="#fff" stroke-width="3"/>`,
  }),

  // Pointy Pete (Stabby) — angry, raised dagger
  "stabby-the-unicorn": frame({
    top: "#4a2030",
    bottom: "#1c0d16",
    glow: "#ff9aa0",
    scene: `${at(body({ face: FACE.angry(), spine: "#5b3340" }), { x: 240 })}
      <g transform="translate(330 150) rotate(28)"><path d="M0-86 14 18 0 40-14 18Z" fill="#dfe6ef" stroke="${ink}" stroke-width="4"/><path d="M-26 40h52M0 40v34" stroke="${ink}" stroke-width="11" stroke-linecap="round"/><circle cx="0" cy="80" r="8" fill="#c9a14a"/></g>
      ${paw(322, 196, { r: 18 })}`,
  }),

  // Speedy Sky-Spike (Swift Flying) — wings + speed lines, zooming
  "swift-flying-unicorn": frame({
    top: "#1f6a7a",
    bottom: "#0c2a32",
    glow: "#bff0ff",
    accents: `<g stroke="#bff0ff" stroke-width="6" stroke-linecap="round" opacity=".7"><path d="M70 200H6M90 236H24M76 272H14"/></g>`,
    scene: `${wing(150, 200, { side: "L", scale: 0.85, fill: "#d6f4ff", edge: "#8ad6ee" })}
      ${at(body({ face: FACE.determined(), spine: "#1c5260", body: "#7ec8d4" }), { x: 270, rot: -8 })}`,
  }),

  // Grand Quilliam (The Great Narwhal) — wizard hat + staff, tusk
  "the-great-narwhal": frame({
    top: "#2c2c6a",
    bottom: "#10102e",
    glow: "#cfc6ff",
    accents: sparkles(
      [
        [110, 120, 5],
        [392, 120, 5],
        [400, 300, 4],
      ],
      "#ffe27b",
    ),
    scene: `${at(body({ face: FACE.happy(), spine: "#24245a", body: "#aaa4ea" }), {})}
      <path d="M196 150q6-48 -4-78q26 24 24 76Z" fill="#eceaff" stroke="${ink}" stroke-width="3"/>
      <!-- wizard hat -->
      <g transform="translate(184 90)"><path d="M-44 14 4-86 44 14Z" fill="#3a3a8e" stroke="${ink}" stroke-width="3"/><path d="M-54 16h108" stroke="${ink}" stroke-width="3"/><rect x="-54" y="10" width="108" height="12" rx="4" fill="#2c2c6a"/>${sparkles(
        [
          [10, -34, 7, "#ffe27b"],
          [-12, -54, 5, "#fff"],
        ],
      )}</g>`,
  }),

  // Cob-Hog (Unicorn on the Cob) — corn cob theme
  "unicorn-on-the-cob": frame({
    top: "#9a8a1e",
    bottom: "#3a3210",
    glow: "#fff0a0",
    scene: `${at(body({ face: FACE.happy(), spine: "#6e6216", body: "#f2dd6a" }), {})}
      <!-- corn cob in paw -->
      <g transform="translate(338 248) rotate(18)"><path d="M-16-40C16-40 16 40 -16 40-34 24 -34-24 -16-40Z" fill="#ffd84a" stroke="${ink}" stroke-width="3"/><g fill="#e8b22a"><circle cx="-16" cy="-26" r="4"/><circle cx="-4" cy="-22" r="4"/><circle cx="-16" cy="-10" r="4"/><circle cx="-4" cy="-6" r="4"/><circle cx="-16" cy="6" r="4"/><circle cx="-4" cy="10" r="4"/><circle cx="-16" cy="22" r="4"/></g><path d="M-16-40q-22-8 -34 6q18 6 34-6Z" fill="#7bbf5a"/></g>`,
  }),

  // Phoenix Prickle (Unicorn Phoenix) — fiery wings, reborn from flame
  "unicorn-phoenix": frame({
    top: "#7a2a1e",
    bottom: "#2c0c08",
    glow: "#ffb05a",
    accents: `<g opacity=".8"><path d="M250 380q-30-40 0-80 30 40 0 80Z" fill="#ff8a3c"/><path d="M180 390q-20-30 0-60 20 30 0 60Z" fill="#ffb24a" opacity=".7"/><path d="M320 390q-20-30 0-60 20 30 0 60Z" fill="#ffb24a" opacity=".7"/></g>`,
    scene: `<!-- fiery wings -->
      <path d="M150 230q-70-10 -100 30 50-6 56 6q-40 14 -50 50 60-26 96-50Z" fill="#ff7a2a" stroke="#ffce6a" stroke-width="2"/>
      <path d="M350 230q70-10 100 30 -50-6 -56 6q40 14 50 50 -60-26 -96-50Z" fill="#ff7a2a" stroke="#ffce6a" stroke-width="2"/>
      ${at(body({ face: FACE.determined(), spine: "#a83a1e", body: "#ffb46a", belly: "#ffd29a" }), {})}
      ${sparkles(
        [
          [120, 120, 5],
          [392, 130, 5],
        ],
        "#ffe27b",
      )}`,
  }),

  // Undead Underbrush (Zombie) — green, stitches, bolt
  "zombie-unicorn": frame({
    top: "#27402e",
    bottom: "#0e1a13",
    glow: "#9bd17f",
    accents: `<g stroke="#6b8f5a" stroke-width="4" opacity=".5"><path d="M70 330c14-30 14-60 0-90M430 330c-14-30-14-60 0-90"/></g>`,
    scene: `${at(body({ face: FACE.dead(), spine: "#3f5a3a", body: "#bcd3a0", belly: "#cfe2b8", spineLite: "#557049" }), { rot: -3 })}
      <path d="M120 250l30 8M120 266l30-8" stroke="${ink}" stroke-width="3"/>
      <g transform="translate(360 150) rotate(10)"><rect x="-7" y="0" width="14" height="34" rx="4" fill="#bcbcbc"/><rect x="-7" y="-30" width="14" height="34" rx="4" fill="#9c9c9c"/></g>
      <g fill="#9bd17f" opacity=".7"><circle cx="180" cy="320" r="6"/><circle cx="330" cy="330" r="5"/></g>`,
  }),
};
