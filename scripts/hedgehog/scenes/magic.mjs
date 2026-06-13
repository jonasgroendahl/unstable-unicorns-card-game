import { SKIN, FACE, body, paw, frame, at, sparkles } from "../kit.mjs";

// Magic ("Mayhem") cards — the hedgehog casts or suffers the effect.
const ink = SKIN.ink;

export const MAGIC = {
  // Prickle Punt (Back Kick) — hedgehog kicking backward
  "back-kick": frame({
    top: "#7a4a2a",
    bottom: "#2c1810",
    glow: "#ffce9a",
    accents: `<g stroke="#ffce6a" stroke-width="5" stroke-linecap="round" opacity=".6"><path d="M430 230h40M420 262h44"/></g>`,
    scene: `${at(body({ face: FACE.manic(), spine: "#5a3420", body: "#e8a86a" }), { x: 240, rot: 6 })}
      <!-- back leg kicking out -->
      <path d="M360 300q60 0 96 -30" stroke="#e8a86a" stroke-width="26" stroke-linecap="round" fill="none"/>
      <ellipse cx="460" cy="266" rx="20" ry="16" fill="#e8a86a"/>
      <g stroke="#fff" stroke-width="4" opacity=".5"><path d="M470 240l16-10M474 290l16 8"/></g>`,
  }),

  // Brazen Burglary (Blatant Thievery) — masked, swag bag
  "blatant-thievery": frame({
    top: "#2c2c40",
    bottom: "#101018",
    glow: "#9aa6c8",
    accents: sparkles([[392, 120, 4]], "#fff"),
    scene: `${at(body({ face: FACE.smug(), spine: "#23232e", body: "#6a7080" }), {})}
      <!-- robber mask band over eyes -->
      <rect x="288" y="262" width="72" height="22" rx="8" fill="#1c1c24"/>
      <!-- swag sack with $ -->
      <g transform="translate(338 260)"><path d="M-30 0c-6-20 10-30 30-30s36 10 30 30c8 24-8 40-30 40s-38-16-30-40Z" fill="#3a3a46" stroke="${ink}" stroke-width="3"/><text x="0" y="20" font-family="Arial" font-size="30" font-weight="900" fill="#cfd6df" text-anchor="middle">$</text></g>`,
  }),

  // Fortune Flipper (Change of Luck) — tossing dice
  "change-of-luck": frame({
    top: "#2f6a4a",
    bottom: "#12281c",
    glow: "#bff0c8",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 4],
      ],
      "#fff",
    ),
    scene: `${at(body({ face: FACE.happy(), spine: "#2a5638", body: "#7ec890" }), {})}
      <!-- two tumbling dice -->
      <g transform="translate(330 150) rotate(-12)"><rect x="-26" y="-26" width="52" height="52" rx="10" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="-10" cy="-10" r="5" fill="${ink}"/><circle cx="10" cy="10" r="5" fill="${ink}"/><circle r="5" fill="${ink}"/></g>
      <g transform="translate(380 220) rotate(18)"><rect x="-22" y="-22" width="44" height="44" rx="9" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="-9" cy="-9" r="4" fill="${ink}"/><circle cx="9" cy="-9" r="4" fill="${ink}"/><circle cx="-9" cy="9" r="4" fill="${ink}"/><circle cx="9" cy="9" r="4" fill="${ink}"/></g>`,
  }),

  // Sequin Cyclone (Glitter Tornado) — caught in a glitter twister
  "glitter-tornado": frame({
    top: "#3a2c64",
    bottom: "#150f2c",
    glow: "#ffd6f4",
    accents: sparkles([
      [110, 110, 5, "#ff7ad1"],
      [392, 130, 5, "#7be0ff"],
      [400, 300, 4, "#ffe27b"],
    ]),
    scene: `<!-- funnel -->
      <path d="M120 70h260l-46 60H166ZM166 130h168l-40 56H206ZM206 186h120l-34 54H240ZM240 240h80l-30 60H270Z" fill="#b48ce8" opacity=".35"/>
      ${at(body({ face: FACE.surprised(), spine: "#3a2c64", body: "#c2a8ec" }), { y: 250, rot: 10, s: 0.92 })}
      ${sparkles([
        [150, 120, 6, "#ff7ad1"],
        [330, 150, 6, "#7be0ff"],
        [200, 200, 5, "#ffe27b"],
        [320, 230, 5, "#7be08e"],
      ])}`,
  }),

  // Prickly Windfall (Good Deal) — drawing a fan of cards, grinning
  "good-deal": frame({
    top: "#2a5a8e",
    bottom: "#101e38",
    glow: "#bcd8ff",
    scene: `${at(body({ face: FACE.smug(), spine: "#244a74", body: "#8fb6e8" }), {})}
      <!-- fan of cards -->
      <g transform="translate(330 250)"><g transform="rotate(-22)"><rect x="-22" y="-40" width="44" height="76" rx="6" fill="#fff" stroke="${ink}" stroke-width="2.5"/></g><g transform="rotate(0)"><rect x="-22" y="-40" width="44" height="76" rx="6" fill="#ffe9b0" stroke="${ink}" stroke-width="2.5"/></g><g transform="rotate(22)"><rect x="-22" y="-40" width="44" height="76" rx="6" fill="#fff" stroke="${ink}" stroke-width="2.5"/></g><circle cy="-10" r="9" fill="#e85b96"/></g>`,
  }),

  // Burrow Vortex (Mystical Vortex) — swirling portal pulling things in
  "mystical-vortex": frame({
    top: "#2c2c6e",
    bottom: "#10102c",
    glow: "#c6c6ff",
    accents: sparkles(
      [
        [110, 110, 4],
        [392, 120, 4],
      ],
      "#fff",
    ),
    scene: `<!-- spiral portal -->
      <g transform="translate(340 200)" fill="none" stroke-linecap="round"><path d="M0 0a14 14 0 1 1 -10 14" stroke="#8a6ee0" stroke-width="10"/><path d="M-4 28a40 40 0 1 1 36-50" stroke="#6a4ad0" stroke-width="12"/><path d="M-30 50a66 66 0 1 1 64-86" stroke="#4a2cb0" stroke-width="14"/></g>
      ${at(body({ face: FACE.surprised(), spine: "#2c2c6e", body: "#a6a6ee" }), { x: 200, rot: 12, s: 0.9 })}`,
  }),

  // Big Red Do-Over (Reset Button) — slamming a big red button
  "reset-button": frame({
    top: "#7a2a2a",
    bottom: "#2c0e0e",
    glow: "#ffb0a0",
    scene: `${at(body({ face: FACE.manic(), spine: "#5a1e1e", body: "#ef8a7a" }), { x: 220 })}
      <!-- big red button -->
      <g transform="translate(346 270)"><ellipse cy="22" rx="60" ry="22" fill="#7a1e1e"/><ellipse rx="60" ry="24" fill="#b82a2a" stroke="${ink}" stroke-width="3"/><ellipse cy="-6" rx="44" ry="16" fill="#e85b5b"/></g>
      ${paw(300, 250, { r: 16 })}`,
  }),

  // Aim Again (Re-Target) — aiming a crosshair scope
  "re-target": frame({
    top: "#2a5a5a",
    bottom: "#102424",
    glow: "#bff0ec",
    scene: `${at(body({ face: FACE.determined(), spine: "#234a4a", body: "#7ec8c0" }), {})}
      <!-- crosshair reticle -->
      <g transform="translate(348 210)"><circle r="46" fill="none" stroke="#ffe27b" stroke-width="5"/><circle r="10" fill="none" stroke="#ffe27b" stroke-width="4"/><path d="M0-60v28M0 32v28M-60 0h28M32 0h28" stroke="#ffe27b" stroke-width="5" stroke-linecap="round"/></g>`,
  }),

  // Rattle the Burrow (Shake Up) — shaking everything, motion
  "shake-up": frame({
    top: "#7a5a1e",
    bottom: "#2c2010",
    glow: "#ffe6a0",
    accents: `<g stroke="#ffe27b" stroke-width="5" stroke-linecap="round" opacity=".6"><path d="M90 200l-20-12M96 240l-22 4M410 200l20-12M404 240l22 4"/></g>`,
    scene: `${at(body({ face: FACE.surprised({ x: 2 }), spine: "#5a4218", body: "#f0c862" }), { rot: -8 })}
      <g opacity=".4">${at(body({ face: FACE.surprised(), spine: "#5a4218", body: "#f0c862" }), { rot: 8 })}</g>`,
  }),

  // Precision Prick (Targeted Destruction) — laser-aiming a beam
  "targeted-destruction": frame({
    top: "#7a2a3a",
    bottom: "#2c0e16",
    glow: "#ffaeb8",
    accents: `<g fill="#ff6b6b" opacity=".7">${sparkles([
      [420, 300, 10],
      [400, 320, 6],
    ])}</g>`,
    scene: `${at(body({ face: FACE.determined(), spine: "#5a1e2a", body: "#e8849a" }), { x: 220 })}
      <!-- targeting beam -->
      <path d="M300 250 L450 320" stroke="#ff5b5b" stroke-width="4" opacity=".8"/>
      <g transform="translate(450 320)"><circle r="20" fill="none" stroke="#ff5b5b" stroke-width="4"/><path d="M0-28v14M0 14v14M-28 0h14M14 0h14" stroke="#ff5b5b" stroke-width="4"/></g>`,
  }),

  // One Prick, Two Pops (Two-For-One) — juggling two items
  "two-for-one": frame({
    top: "#2a5a7a",
    bottom: "#0e2230",
    glow: "#bfe6ff",
    scene: `${at(body({ face: FACE.happy(), spine: "#234a64", body: "#7eb8d4" }), {})}
      <!-- two orbs above -->
      <circle cx="300" cy="120" r="24" fill="#ff9ec8" stroke="${ink}" stroke-width="3"/>
      <circle cx="372" cy="150" r="24" fill="#ffe27b" stroke="${ink}" stroke-width="3"/>
      <g stroke="#fff" stroke-width="2.5" opacity=".5" fill="none"><path d="M300 150q0 30 30 50M372 178q0 24 -26 42"/></g>`,
  }),

  // Lopsided Swap (Unfair Bargain) — sly handshake/trade
  "unfair-bargain": frame({
    top: "#5a3a7a",
    bottom: "#221430",
    glow: "#dcc0ff",
    scene: `${at(body({ face: FACE.smug(), spine: "#472d5e", body: "#bda2dc" }), { x: 200 })}
      <!-- offering hand vs grabbing -->
      ${paw(300, 250, { r: 16 })}
      <g transform="translate(360 250)"><path d="M0 0q40-10 60 6q-30 18 -60 6Z" fill="#c2a8ec"/></g>
      <text x="360" y="180" font-family="Arial" font-size="30" font-weight="900" fill="#ffb0b0" text-anchor="middle">?</text>`,
  }),

  // Quill Tonic (Unicorn Poison) — bubbling potion vial
  "unicorn-poison": frame({
    top: "#2f6a3a",
    bottom: "#102818",
    glow: "#bff0a8",
    accents: `<g fill="#9bd17f" opacity=".6">${sparkles([
      [110, 120, 5],
      [392, 120, 5],
    ])}</g>`,
    scene: `${at(body({ face: FACE.manic(), spine: "#244a2a", body: "#8ec878" }), { x: 220 })}
      <!-- potion vial -->
      <g transform="translate(348 250)"><path d="M-14-44h28v22l18 34c6 14-2 28-18 28h-28c-16 0-24-14-18-28l18-34Z" fill="#7be08e" stroke="${ink}" stroke-width="3" fill-opacity=".85"/><rect x="-16" y="-52" width="32" height="12" rx="4" fill="#6a5238"/><circle cx="-6" cy="30" r="4" fill="#fff" opacity=".7"/><circle cx="8" cy="18" r="3" fill="#fff" opacity=".7"/></g>`,
  }),

  // Pocket-Sized Panic (Unicorn Shrinkray) — shrink ray gun + tiny target
  "unicorn-shrinkray": frame({
    top: "#3a2c7a",
    bottom: "#141030",
    glow: "#c6c0ff",
    accents: `<g stroke="#9a8aff" stroke-width="3" opacity=".5"><path d="M380 250l40 10M384 270l40-4"/></g>`,
    scene: `${at(body({ face: FACE.manic(), spine: "#2c2260", body: "#a89aec" }), { x: 210 })}
      <!-- ray gun -->
      <g transform="translate(320 250)"><rect x="-10" y="-10" width="50" height="24" rx="6" fill="#6a5ad0"/><rect x="-26" y="0" width="20" height="34" rx="5" fill="#6a5ad0"/><circle cx="46" cy="2" r="12" fill="#c6c0ff"/></g>
      <!-- shrink cone + tiny hog -->
      <path d="M380 240l70-14v44Z" fill="#c6c0ff" opacity=".35"/>
      <g transform="translate(440 250) scale(.18)"><path d="M-96 36C-96-58-24-104 36-92 116-76 116 24 92 70 64 122-96 130-96 36Z" fill="#2c2260"/><ellipse cx="26" cy="34" rx="84" ry="72" fill="#a89aec"/></g>`,
  }),

  // Prickle Trade (Unicorn Swap) — two hogs swapping places, arrows
  "unicorn-swap": frame({
    top: "#2a5a6a",
    bottom: "#0e2228",
    glow: "#bfeef0",
    scene: `<g transform="translate(160 250) scale(.5)">${body({ face: FACE.happy(), spine: "#234a52", body: "#7ec0c8" })}</g>
      <g transform="translate(340 250) scale(-.5 .5)">${body({ face: FACE.happy(), spine: "#52344a", body: "#e0a0b8" })}</g>
      <g fill="none" stroke="#ffe27b" stroke-width="6" stroke-linecap="round"><path d="M200 180q50-40 100 0"/><path d="M300 320q-50 40 -100 0"/><path d="M196 176l-10-16 18 4M304 324l10 16-18-4"/></g>`,
  }),
};
