// Reusable hedgehog character kit for the Unhinged Hedgehogs deck.
//
// Philosophy: every card is its own little scene where the hedgehog *does the
// thing the card is about* — the way Unstable Unicorns gives each card its own
// character moment. Scenes compose these parts; they are not a shared template.
//
// Local coordinate space: parts draw around origin (0,0) at the hedgehog's
// chest, facing right. Scenes wrap them in <g transform> to place/scale/tilt.

export const SKIN = {
  body: "#ecc69c",
  bodyShade: "#d9ab7c",
  belly: "#f6dcb6",
  spine: "#5b4636",
  spineLite: "#806244",
  ink: "#241d2b",
  blush: "#ea8f7a",
  tongue: "#d96b6b",
  paw: "#e3b988",
};

// ---- Faces -----------------------------------------------------------------
// Origin sits on the brow, between the eyes. `look` = {x,y} nudges pupils.

const eyeWhitesPupils = (look = {}, ex = 16, ey = 0, r = 9, pr = 4) => {
  const lx = -ex,
    rx = ex;
  return `<circle cx="${lx}" cy="${ey}" r="${r}" fill="${SKIN.ink}"/><circle cx="${rx}" cy="${ey}" r="${r}" fill="${SKIN.ink}"/>
    <circle cx="${lx + 2.5}" cy="${ey - 2.5}" r="${pr * 0.45}" fill="#fff"/><circle cx="${rx + 2.5}" cy="${ey - 2.5}" r="${pr * 0.45}" fill="#fff"/>`;
};

export const FACE = {
  happy: (look = {}) => `
    ${eyeWhitesPupils(look)}
    <path d="M-13 20q13 12 26 0" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
  smile: (look = {}) => `
    ${eyeWhitesPupils(look, 16, 0, 8)}
    <path d="M-10 19q10 8 20 0" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  manic: (look = {}) => `
    <circle cx="-16" cy="-2" r="11" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    <circle cx="16" cy="-2" r="11" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    <circle cx="${-16 + (look.x ?? 0)}" cy="${1 + (look.y ?? 0)}" r="4.5" fill="${SKIN.ink}"/>
    <circle cx="${16 + (look.x ?? 0)}" cy="${1 + (look.y ?? 0)}" r="4.5" fill="${SKIN.ink}"/>
    <path d="M-18 17q18 22 36 0q-18 9-36 0Z" fill="${SKIN.tongue}" stroke="${SKIN.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
  angry: () => `
    <path d="M-27-10 -8-2" stroke="${SKIN.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M27-10 8-2" stroke="${SKIN.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-16" cy="4" r="7.5" fill="${SKIN.ink}"/><circle cx="16" cy="4" r="7.5" fill="${SKIN.ink}"/>
    <path d="M-12 23q12 8 24 0" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
  sleepy: () => `
    <path d="M-24 0q8 8 16 0" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M8 0q8 8 16 0" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-7 20q7 6 14 0" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  dead: () => `
    <path d="M-23-6 -10 6M-23 6 -10-6" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M10-6 23 6M10 6 23-6" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-11 22q11 5 12-3q3 8 13 2" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  love: () => `
    <path d="M-16-7c-7-7-17 2-7 9l7 7 7-7c10-7 0-16-7-9Z" fill="${SKIN.blush}"/>
    <path d="M16-7c-7-7-17 2-7 9l7 7 7-7c10-7 0-16-7-9Z" fill="${SKIN.blush}"/>
    <path d="M-12 22q12 9 24 0" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
  surprised: (look = {}) => `
    <circle cx="-16" cy="0" r="10" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    <circle cx="16" cy="0" r="10" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    ${eyeWhitesPupils(look, 16, look.y ?? 0, 4.5, 4.5)}
    <ellipse cx="0" cy="25" rx="7" ry="9" fill="${SKIN.ink}"/>`,
  wink: () => `
    <path d="M-25-1q9-9 18 0" fill="none" stroke="${SKIN.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="16" cy="0" r="8.5" fill="${SKIN.ink}"/><circle cx="18.5" cy="-2.5" r="2" fill="#fff"/>
    <path d="M-13 19q15 11 26-2" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
  smug: () => `
    <path d="M-26-4q9 6 18 1" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M8-3q9 5 18-1" fill="none" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-10 18q14 7 24-3" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  cool: () => `
    <rect x="-30" y="-8" width="60" height="20" rx="9" fill="${SKIN.ink}"/>
    <rect x="-28" y="-6" width="22" height="14" rx="6" fill="#3a4a6b"/><rect x="6" y="-6" width="22" height="14" rx="6" fill="#3a4a6b"/>
    <path d="M-30 0h60" stroke="${SKIN.ink}" stroke-width="4"/>
    <path d="M-9 22q9 6 18 0" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  scared: () => `
    <circle cx="-16" cy="0" r="11" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    <circle cx="16" cy="0" r="11" fill="#fff" stroke="${SKIN.ink}" stroke-width="3"/>
    <circle cx="-15" cy="3" r="4" fill="${SKIN.ink}"/><circle cx="17" cy="3" r="4" fill="${SKIN.ink}"/>
    <path d="M-12 26q12-8 24 0" fill="none" stroke="${SKIN.ink}" stroke-width="4" stroke-linecap="round"/>`,
  determined: () => `
    <path d="M-27-6 -9-3" stroke="${SKIN.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M27-6 9-3" stroke="${SKIN.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-16" cy="5" r="7.5" fill="${SKIN.ink}"/><circle cx="16" cy="5" r="7.5" fill="${SKIN.ink}"/>
    <path d="M-11 23h22" stroke="${SKIN.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
};

// ---- Hedgehog body ---------------------------------------------------------
// Spiky-backed hedgehog facing right; face near (70,40). Wrap result yourself.
// opts: face, blush, spine, spineLite, body, belly.

export function body({
  face = FACE.happy(),
  blush = true,
  spine = SKIN.spine,
  spineLite = SKIN.spineLite,
  body = SKIN.body,
  belly = SKIN.belly,
} = {}) {
  return `
  <path d="M-150 60C-150-78-60-140 30-128 132-114 150 8 120 86 90 150-150 178-150 60Z" fill="${spine}"/>
  <g stroke="${spineLite}" stroke-width="7" stroke-linecap="round" opacity=".85">
    <path d="M-120 30-150-2M-104-18-128-58M-70-42-86-92M-30-54-36-108M16-54 18-110M58-46 74-96M96-28 122-64M118 2 152-18"/>
  </g>
  <ellipse cx="36" cy="44" rx="120" ry="100" fill="${body}"/>
  <ellipse cx="44" cy="74" rx="78" ry="60" fill="${belly}" opacity=".55"/>
  <path d="M120 36c40 2 60 26 58 50-2 22-26 34-54 30Z" fill="${body}"/>
  <circle cx="171" cy="64" r="9" fill="${SKIN.ink}"/>
  ${blush ? `<ellipse cx="86" cy="88" rx="20" ry="12" fill="${SKIN.blush}" opacity=".5"/>` : ""}
  <g transform="translate(70 40)">${face}</g>`;
}

// Small round baby hedgehog. opts same as body. Face near (40,18).
export function baby({
  face = FACE.happy({ y: 1 }),
  spine = SKIN.spine,
  spineLite = SKIN.spineLite,
  body = SKIN.body,
  belly = SKIN.belly,
} = {}) {
  return `
  <path d="M-96 36C-96-58-24-104 36-92 116-76 116 24 92 70 64 122-96 130-96 36Z" fill="${spine}"/>
  <g stroke="${spineLite}" stroke-width="6" stroke-linecap="round" opacity=".85">
    <path d="M-74 18-96-6M-58-28-74-58M-24-42-28-80M22-40 24-80M58-30 76-58M84-6 108-22"/>
  </g>
  <ellipse cx="26" cy="34" rx="84" ry="72" fill="${body}"/>
  <ellipse cx="32" cy="56" rx="56" ry="44" fill="${belly}" opacity=".55"/>
  <path d="M88 30c30 0 44 18 42 36-2 16-20 24-40 20Z" fill="${body}"/>
  <circle cx="126" cy="50" r="7" fill="${SKIN.ink}"/>
  <ellipse cx="66" cy="64" rx="15" ry="9" fill="${SKIN.blush}" opacity=".5"/>
  <g transform="translate(40 18) scale(.82)">${face}</g>`;
}

// A front paw/mitt at (x,y). dir +1 = thumb toward right.
export function paw(x, y, { dir = 1, r = 17, fill = SKIN.paw } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${dir} 1)">
    <ellipse rx="${r}" ry="${r * 0.9}" fill="${fill}"/>
    <circle cx="${r * 0.5}" cy="-3" r="${r * 0.85}" fill="${fill}"/>
  </g>`;
}

// Feathered wing. side: "L" or "R". Place at the hog's shoulder.
export function wing(x, y, { side = "R", scale = 1, fill = "#fbf3df", edge = "#cfe6ff" } = {}) {
  const dir = side === "L" ? -1 : 1;
  return `<g transform="translate(${x} ${y}) scale(${dir * scale} ${scale})">
    <path d="M0 0c40-26 92-30 132-6-30 6-30 6-54 18 36 0 60 8 84 28-34 0-40 0-66 10 30 6 48 18 64 40-44-8-92-22-130-52Z" fill="${fill}" stroke="${edge}" stroke-width="3"/>
  </g>`;
}

// ---- Scene frame -----------------------------------------------------------
// 500x430 art frame: themed vertical gradient + soft center spotlight +
// ground shadow. accents render behind the spotlight, scene in front.

export function frame({ top, bottom, glow = "#fff8d8", scene, accents = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 430">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <radialGradient id="spot" cx=".5" cy=".42" r=".62"><stop stop-color="${glow}" stop-opacity=".5"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="500" height="430" fill="url(#bg)"/>
  ${accents}
  <ellipse cx="250" cy="210" rx="235" ry="205" fill="url(#spot)"/>
  <ellipse cx="250" cy="378" rx="190" ry="30" fill="#000" opacity=".16"/>
  ${scene}
</svg>`;
}

// Placement helper: wrap markup at position/scale/rotation.
export function at(markup, { x = 250, y = 235, s = 1, rot = 0 } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${markup}</g>`;
}

// A scattering of sparkles/dots. pts = [[x,y,r,color?], ...]
export function sparkles(pts, color = "#fff") {
  return pts
    .map(([x, y, r, c]) => {
      const fill = c ?? color;
      return `<path transform="translate(${x} ${y})" d="M0 ${-r}L${r * 0.28} ${-r * 0.28} ${r} 0 ${r * 0.28} ${r * 0.28} 0 ${r} ${-r * 0.28} ${r * 0.28} ${-r} 0 ${-r * 0.28} ${-r * 0.28}Z" fill="${fill}"/>`;
    })
    .join("");
}
