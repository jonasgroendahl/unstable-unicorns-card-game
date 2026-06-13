import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const artDir = resolve(root, "public/themes/unhinged-hedgehogs/cards");
const catalogPath = resolve(root, "src/game/themes/unhingedHedgehogs.ts");

const cards = [
  ["alluring-narwhal", "Beguiling Bristle", "heart"],
  ["americorn", "Star-Spangled Spiker", "star"],
  ["angel-unicorn", "Halo Hedge", "halo"],
  ["annoying-flying-unicorn", "Airborne Nuisance", "megaphone"],
  ["baby-narwhal", "Tiny Tusklet", "tusk"],
  ["baby-unicorn-black", "Midnight Hedgelet", "moon"],
  ["baby-unicorn-blue", "Blueberry Hedgelet", "berry"],
  ["baby-unicorn-brown", "Acorn Hedgelet", "acorn"],
  ["baby-unicorn-death", "Doom Hedgelet", "skull"],
  ["baby-unicorn-green", "Mossy Hedgelet", "leaf"],
  ["baby-unicorn-orange", "Pumpkin Hedgelet", "pumpkin"],
  ["baby-unicorn-pink", "Bubblegum Hedgelet", "bow"],
  ["baby-unicorn-purple", "Plum Hedgelet", "crystal"],
  ["baby-unicorn-rainbow", "Prism Hedgelet", "rainbow"],
  ["baby-unicorn-red", "Firecracker Hedgelet", "flame"],
  ["baby-unicorn-white", "Snowball Hedgelet", "snow"],
  ["baby-unicorn-yellow", "Sunbeam Hedgelet", "sun"],
  ["back-kick", "Prickle Punt", "boot"],
  ["barbed-wire", "Bramble Trouble", "bramble"],
  ["basic-unicorn-blue", "Denim Darren", "glasses"],
  ["basic-unicorn-green", "Vinyl Vera", "record"],
  ["basic-unicorn-indigo", "Emoji Edie", "phone"],
  ["basic-unicorn-orange", "Pumpkin Pip", "coffee"],
  ["basic-unicorn-purple", "Selfie Sylvie", "camera"],
  ["basic-unicorn-red", "Bearded Bert", "beard"],
  ["basic-unicorn-yellow", "Disco Daisy", "disco"],
  ["black-knight-unicorn", "Midnight Sentinel", "shield"],
  ["blatant-thievery", "Brazen Burglary", "mask"],
  ["blinding-light", "High-Beam Havoc", "spotlight"],
  ["broken-stable", "Collapsed Burrow", "burrow"],
  ["chainsaw-unicorn", "Chainsaw Chester", "chainsaw"],
  ["change-of-luck", "Fortune Flipper", "dice"],
  ["classy-narwhal", "Dapper Quilliam", "bowtie"],
  ["double-dutch", "Double Trouble", "rope"],
  ["extra-tail", "Bonus Bristles", "tail"],
  ["extremely-destructive-unicorn", "Wrecking Bristle", "dynamite"],
  ["extremely-fertile-unicorn", "Prolific Prickles", "nest"],
  ["ginormous-unicorn", "Colossal Cuddler", "giant"],
  ["glitter-bomb", "Confetti Catastrophe", "bomb"],
  ["glitter-tornado", "Sequin Cyclone", "tornado"],
  ["good-deal", "Prickly Windfall", "cards"],
  ["greedy-flying-unicorn", "Sky-High Hoarder", "coins"],
  ["llamacorn", "Hedge-Llama Drama", "llama"],
  ["magical-flying-unicorn", "Arcane Aviator", "wand"],
  ["magical-kittencorn", "Kitten in Quills", "cat"],
  ["majestic-flying-unicorn", "Regal Glider", "crown"],
  ["mermaid-unicorn", "Mermaid Hedge", "mermaid"],
  ["mystical-vortex", "Burrow Vortex", "vortex"],
  ["nanny-cam", "Burrowcam", "camera"],
  ["narwhal", "Pointy Porcupine", "tusk"],
  ["narwhal-torpedo", "Quill Torpedo", "rocket"],
  ["neigh", "Nope!", "stop"],
  ["pandamonium", "Panda Prickle Party", "panda"],
  ["puppicorn", "Puppy-Prickle", "puppy"],
  ["queen-bee-unicorn", "Queen Bristle", "queen"],
  ["rainbow-aura", "Spectrum Shield", "aura"],
  ["rainbow-mane", "Technicolor Tuft", "rainbow"],
  ["rainbow-unicorn", "Prism Prickles", "prism"],
  ["re-target", "Aim Again", "target"],
  ["reset-button", "Big Red Do-Over", "reset"],
  ["rhinocorn", "Rhino-Hedge Rampage", "rhino"],
  ["sadistic-ritual", "Grim Grooming", "candle"],
  ["seductive-unicorn", "Charming Charmer", "rose"],
  ["shabby-the-narwhal", "Scruffy Quilliam", "scarf"],
  ["shake-up", "Rattle the Burrow", "shaker"],
  ["shark-with-a-horn", "Shark-Quill", "shark"],
  ["slowdown", "Molasses Mode", "snail"],
  ["stabby-the-unicorn", "Pointy Pete", "dagger"],
  ["summoning-ritual", "Circle of Quills", "ritual"],
  ["super-neigh", "Absolutely Nope!", "super-stop"],
  ["swift-flying-unicorn", "Speedy Sky-Spike", "speed"],
  ["targeted-destruction", "Precision Prick", "crosshair"],
  ["the-great-narwhal", "Grand Quilliam", "wizard"],
  ["tiny-stable", "Pocket Burrow", "tiny-burrow"],
  ["two-for-one", "One Prick, Two Pops", "pair"],
  ["unfair-bargain", "Lopsided Swap", "handshake"],
  ["unicorn-lasso", "Hedgehog Hook", "lasso"],
  ["unicorn-on-the-cob", "Cob-Hog", "corn"],
  ["unicorn-phoenix", "Phoenix Prickle", "phoenix"],
  ["unicorn-poison", "Quill Tonic", "poison"],
  ["unicorn-shrinkray", "Pocket-Sized Panic", "shrink"],
  ["unicorn-swap", "Prickle Trade", "swap"],
  ["yay", "Heck Yes!", "party"],
  ["zombie-unicorn", "Undead Underbrush", "zombie"],
];

const palettes = [
  ["#0f5964", "#68dfce", "#ffdf68", "#ff887d"],
  ["#173f63", "#75bfe8", "#ffd86a", "#f37a86"],
  ["#51376f", "#a785d8", "#ffe27b", "#63d6c5"],
  ["#79464e", "#f18b74", "#ffd96c", "#4cb7a9"],
  ["#245847", "#75c899", "#ffd56b", "#ef8178"],
  ["#4f3c2d", "#d59a67", "#ffdc79", "#68c8bb"],
];

function hash(value) {
  let result = 2166136261;
  for (const char of value) {
    result ^= char.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function motifSvg(motif, ink, accent) {
  const shapes = {
    heart: `<path d="M0 20C-48-15-72 50 0 96C72 50 48-15 0 20Z" fill="${accent}"/>`,
    star: `<path d="m0-55 16 35 39 4-29 26 9 38L0 28l-35 20 9-38-29-26 39-4Z" fill="${accent}"/>`,
    halo: `<ellipse cy="-30" rx="62" ry="18" fill="none" stroke="${accent}" stroke-width="14"/>`,
    megaphone: `<path d="M-62-20 38-57v112L-62 20Z" fill="${accent}"/><rect x="-82" y="-25" width="25" height="50" rx="8" fill="${ink}"/>`,
    tusk: `<path d="M-55 55C-8 25 24-20 28-80 68-6 29 64-55 55Z" fill="${accent}"/>`,
    moon: `<path d="M30-62A64 64 0 1 0 58 52 55 55 0 0 1 30-62Z" fill="${accent}"/>`,
    berry: `<circle cx="-20" cy="10" r="38" fill="${accent}"/><circle cx="26" cy="20" r="34" fill="${accent}"/><path d="M0-12c-4-30 16-46 42-45" fill="none" stroke="${ink}" stroke-width="10"/>`,
    acorn: `<path d="M-43-10c0-48 86-48 86 0v22h-86Z" fill="${ink}"/><path d="M-35 13h70c0 82-70 82-70 0Z" fill="${accent}"/>`,
    skull: `<path d="M-52-12a52 52 0 1 1 104 0v42L28 50v26h-56V50l-24-20Z" fill="${accent}"/><circle cx="-20" cy="-8" r="10" fill="${ink}"/><circle cx="20" cy="-8" r="10" fill="${ink}"/>`,
    leaf: `<path d="M-60 44C-42-53 20-76 66-64 56 1 23 60-60 44Z" fill="${accent}"/><path d="M-43 32 38-42" stroke="${ink}" stroke-width="8"/>`,
    pumpkin: `<ellipse rx="65" ry="52" fill="${accent}"/><path d="M0-52v-28" stroke="${ink}" stroke-width="13"/><path d="M0-48v96M-30-42c-18 27-18 57 0 84M30-42c18 27 18 57 0 84" fill="none" stroke="${ink}" stroke-width="7" opacity=".45"/>`,
    bow: `<path d="M-8 0C-78-62-91 36-16 18M8 0c70-62 83 36 8 18" fill="${accent}" stroke="${ink}" stroke-width="8"/><circle r="18" fill="${ink}"/>`,
    crystal: `<path d="m0-76 55 42-17 90h-76l-17-90Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M0-76v132M-55-34 0 0l55-34" fill="none" stroke="${ink}" stroke-width="6" opacity=".55"/>`,
    rainbow: `<path d="M-72 42a72 72 0 0 1 144 0" fill="none" stroke="${accent}" stroke-width="22"/><path d="M-48 42a48 48 0 0 1 96 0" fill="none" stroke="${ink}" stroke-width="15"/>`,
    flame: `<path d="M0 70C-74 42-58-24-10-78-4-35 23-29 31-2 51-19 58-37 58-49 91 13 70 62 0 70Z" fill="${accent}"/>`,
    snow: `<path d="M0-70V70M-61-35 61 35M-61 35 61-35" stroke="${accent}" stroke-width="13"/><circle r="18" fill="${ink}"/>`,
    sun: `<circle r="43" fill="${accent}"/><path d="M0-78V-58M0 58v20M-78 0h20M58 0h20M-55-55l15 15M40 40l15 15M55-55 40-40M-40 40l-15 15" stroke="${ink}" stroke-width="10"/>`,
    boot: `<path d="M-55-63h48v71c24 20 49 28 79 25v37H-58Z" fill="${accent}" stroke="${ink}" stroke-width="8"/>`,
    bramble: `<path d="M-75 50C-26-45 31 69 75-40M-65-26l25 3-9-24M5 48l25-1-8 24M40-32l23 9-16-25" fill="none" stroke="${accent}" stroke-width="12"/>`,
    glasses: `<circle cx="-38" r="32" fill="none" stroke="${ink}" stroke-width="12"/><circle cx="38" r="32" fill="none" stroke="${ink}" stroke-width="12"/><path d="M-6 0H6" stroke="${ink}" stroke-width="12"/>`,
    record: `<circle r="70" fill="${ink}"/><circle r="28" fill="${accent}"/><circle r="8" fill="${ink}"/>`,
    phone: `<rect x="-42" y="-70" width="84" height="140" rx="16" fill="${ink}"/><rect x="-30" y="-52" width="60" height="91" rx="7" fill="${accent}"/><circle cy="55" r="7" fill="${accent}"/>`,
    coffee: `<path d="M-62-40H38v82c0 23-19 42-42 42h-16c-23 0-42-19-42-42Z" fill="${accent}"/><path d="M38-16h23c35 0 35 48 0 48H38" fill="none" stroke="${ink}" stroke-width="12"/><path d="M-35-62c-8-20 12-23 5-43M0-62c-8-20 12-23 5-43" fill="none" stroke="${ink}" stroke-width="8"/>`,
    camera: `<rect x="-75" y="-45" width="150" height="100" rx="18" fill="${ink}"/><circle r="38" fill="${accent}"/><circle r="17" fill="${ink}"/><path d="m-48-45 16-25h54l16 25" fill="${ink}"/>`,
    beard: `<path d="M-66-44c17 14 38 17 66 3 28 14 49 11 66-3 10 85-25 124-66 124S-76 41-66-44Z" fill="${ink}"/>`,
    disco: `<circle r="66" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M-60-22H60M-64 20H64M-28-60v120M28-60v120" stroke="${ink}" stroke-width="6" opacity=".55"/>`,
    shield: `<path d="M0-74 65-50v54c0 44-25 70-65 91-40-21-65-47-65-91v-54Z" fill="${accent}" stroke="${ink}" stroke-width="9"/>`,
    mask: `<path d="M-72-24C-22-58 22-58 72-24L55 44C15 60-15 60-55 44Z" fill="${ink}"/><path d="M-50-8c17-14 31-13 44 3-19 16-34 15-44-3ZM50-8C33-22 19-21 6-5c19 16 34 15 44-3Z" fill="${accent}"/>`,
    spotlight: `<path d="m-70-72 50 14-24 79-50-14ZM-5-46 70 76h-150Z" fill="${accent}" opacity=".8"/>`,
    burrow: `<path d="M-78 58v-82L0-78l78 54v82Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-22 58V5c0-30 44-30 44 0v53" fill="${ink}"/><path d="m-55-20 110 34M-44 25 50-4" stroke="${ink}" stroke-width="9"/>`,
    chainsaw: `<path d="M-76-35H35l44 35-44 35H-76Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle cx="-42" cy="0" r="12" fill="${ink}"/><path d="M-48 35v35h70" fill="none" stroke="${ink}" stroke-width="12"/>`,
    dice: `<rect x="-62" y="-62" width="124" height="124" rx="20" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle cx="-30" cy="-30" r="9" fill="${ink}"/><circle cx="30" cy="30" r="9" fill="${ink}"/><circle r="9" fill="${ink}"/>`,
    bowtie: `<path d="M-8 0-75-48v96L-8 8M8 0l67-48v96L8 8" fill="${accent}" stroke="${ink}" stroke-width="8"/><rect x="-14" y="-16" width="28" height="32" rx="7" fill="${ink}"/>`,
    rope: `<path d="M-62-52C39-13 37 40-14 65-55 84-84 42-56 15 1-40 97 0 69 67" fill="none" stroke="${accent}" stroke-width="13" stroke-linecap="round"/>`,
    tail: `<path d="M-65 45C-4 67 60 37 55-30 52-70 5-82-18-52 24-40 29-8 2 8" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/>`,
    dynamite: `<rect x="-58" y="-50" width="38" height="100" rx="12" fill="${accent}"/><rect x="-15" y="-50" width="38" height="100" rx="12" fill="${accent}"/><rect x="28" y="-50" width="38" height="100" rx="12" fill="${accent}"/><path d="M46-50c0-28 33-22 34-52" fill="none" stroke="${ink}" stroke-width="8"/><circle cx="82" cy="-110" r="12" fill="${accent}"/>`,
    nest: `<path d="M-75 15c18 78 132 78 150 0Z" fill="${ink}"/><ellipse cy="8" rx="75" ry="28" fill="${accent}"/><circle cx="-30" cy="-12" r="25" fill="${accent}"/><circle cx="25" cy="-18" r="28" fill="${accent}"/>`,
    giant: `<circle r="78" fill="${accent}" stroke="${ink}" stroke-width="12"/><path d="M-24 5h48M0-24v48" stroke="${ink}" stroke-width="12"/>`,
    bomb: `<circle cy="12" r="62" fill="${ink}"/><path d="M25-44c8-39 45-25 50-65" fill="none" stroke="${ink}" stroke-width="11"/><path d="m76-112 12-24 8 26 24-12-13 25 25 8-27 9" fill="${accent}"/>`,
    tornado: `<path d="M-76-65H76L48-34h-96L34 0h-68l53 34h-38L0 72" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>`,
    cards: `<rect x="-70" y="-58" width="86" height="118" rx="12" fill="${accent}" stroke="${ink}" stroke-width="8" transform="rotate(-16)"/><rect x="-16" y="-58" width="86" height="118" rx="12" fill="#fff0b0" stroke="${ink}" stroke-width="8" transform="rotate(16)"/>`,
    coins: `<circle cx="-30" cy="22" r="38" fill="${accent}" stroke="${ink}" stroke-width="8"/><circle cx="28" cy="-18" r="42" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M28-42v48M16-32h24M16-4h24" stroke="${ink}" stroke-width="7"/>`,
    wand: `<path d="m-58 62 105-105" stroke="${ink}" stroke-width="14" stroke-linecap="round"/><path d="m50-72 12 27 30 3-22 20 7 30-27-15-27 15 7-30-22-20 30-3Z" fill="${accent}"/>`,
    crown: `<path d="m-73-30 32 25L0-66 41-5l32-25-14 88H-59Z" fill="${accent}" stroke="${ink}" stroke-width="9"/>`,
    vortex: `<path d="M-69-30C-9-91 84-30 48 39 17 98-72 66-57 6-46-37 22-52 37-13 51 24 3 49-18 23" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>`,
    rocket: `<path d="M0-85C50-49 58 18 0 65-58 18-50-49 0-85Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><circle cy="-22" r="18" fill="${ink}"/><path d="M-18 58 0 92l18-34" fill="${ink}"/>`,
    stop: `<path d="m-32-72 64 0 40 40v64L32 72h-64l-40-40v-64Z" fill="${accent}" stroke="${ink}" stroke-width="10"/><path d="M-38 0H38" stroke="${ink}" stroke-width="14"/>`,
    panda: `<circle r="63" fill="#fff7d6" stroke="${ink}" stroke-width="9"/><circle cx="-47" cy="-48" r="28" fill="${ink}"/><circle cx="47" cy="-48" r="28" fill="${ink}"/><ellipse cx="-25" cy="-5" rx="18" ry="25" fill="${ink}"/><ellipse cx="25" cy="-5" rx="18" ry="25" fill="${ink}"/>`,
    puppy: `<path d="M-55-18c-45-30-48 33-17 62M55-18c45-30 48 33 17 62" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle r="57" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle cy="16" r="12" fill="${ink}"/>`,
    queen: `<path d="m-70-25 33 22L0-66 37-3l33-22-12 82H-58Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle cy="79" r="15" fill="${accent}"/>`,
    aura: `<circle r="75" fill="none" stroke="${accent}" stroke-width="15"/><circle r="48" fill="none" stroke="${ink}" stroke-width="8" opacity=".7"/>`,
    prism: `<path d="M0-75 68 58H-68Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-84-17H-26M24 3l75-35M31 25l74 11" stroke="${ink}" stroke-width="10"/>`,
    target: `<circle r="70" fill="${accent}" stroke="${ink}" stroke-width="9"/><circle r="40" fill="none" stroke="${ink}" stroke-width="9"/><circle r="12" fill="${ink}"/><path d="M0-88v36M0 52v36M-88 0h36M52 0h36" stroke="${ink}" stroke-width="9"/>`,
    reset: `<path d="M60-15A63 63 0 1 1 20-68" fill="none" stroke="${accent}" stroke-width="16"/><path d="m17-85 44 9-27 36Z" fill="${accent}"/>`,
    rhino: `<path d="M-72 38C-55-42 4-66 68-25 38-21 17-4 8 22Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M20-28 55-82 65-15" fill="${ink}"/>`,
    candle: `<rect x="-30" y="-30" width="60" height="100" rx="10" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M0-36c-31-25-4-50 0-71 23 27 27 49 0 71Z" fill="${accent}"/>`,
    rose: `<circle cy="-20" r="48" fill="${accent}" stroke="${ink}" stroke-width="7"/><path d="M0 25v70M0 56c-24-15-38-8-48 12M0 70c22-17 37-12 50 1" fill="none" stroke="${ink}" stroke-width="9"/>`,
    scarf: `<path d="M-75-26C-28 12 31 10 75-26M28 3l25 83M50 3l37 70" fill="none" stroke="${accent}" stroke-width="22"/>`,
    shaker: `<path d="M-48-70h96L32 72h-64Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-30-26h60M-25 15h50" stroke="${ink}" stroke-width="7"/>`,
    shark: `<path d="M-75 42C-20-54 45-64 78 16 35 2 5 20-10 60Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-8-30 23-84 42-21" fill="${ink}"/>`,
    snail: `<circle cx="23" cy="-2" r="50" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M23-28c34 0 34 52 0 52-20 0-20-30 0-30" fill="none" stroke="${ink}" stroke-width="8"/><path d="M-75 50h130" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>`,
    dagger: `<path d="M0-80 25 30 0 62l-25-32Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M-42 32H42M0 62v30" stroke="${ink}" stroke-width="12"/>`,
    ritual: `<circle r="66" fill="none" stroke="${accent}" stroke-width="10"/><path d="m0-55 14 39 41 1-32 25 12 40L0 27l-35 23 12-40-32-25 41-1Z" fill="${accent}"/>`,
    "super-stop": `<path d="m-38-82 76 0 47 47v70L38 82h-76l-47-47v-70Z" fill="${accent}" stroke="${ink}" stroke-width="11"/><path d="M-47 0H47M0-47v94" stroke="${ink}" stroke-width="15"/>`,
    speed: `<path d="M-82-42H12M-60 0H45M-82 42H12" stroke="${ink}" stroke-width="13" stroke-linecap="round"/><path d="m18-70 66 70-66 70Z" fill="${accent}"/>`,
    crosshair: `<circle r="59" fill="none" stroke="${accent}" stroke-width="13"/><circle r="18" fill="${ink}"/><path d="M0-88v48M0 40v48M-88 0h48M40 0h48" stroke="${ink}" stroke-width="9"/>`,
    wizard: `<path d="M-68 42 0-88 68 42Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-85 46H85" stroke="${ink}" stroke-width="15"/><circle cx="8" cy="-8" r="9" fill="${ink}"/>`,
    "tiny-burrow": `<path d="M-48 43v-52L0-46 48-9v52Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M-15 43V14c0-20 30-20 30 0v29" fill="${ink}"/>`,
    pair: `<circle cx="-33" r="42" fill="${accent}" stroke="${ink}" stroke-width="8"/><circle cx="33" r="42" fill="#fff0b0" stroke="${ink}" stroke-width="8"/>`,
    handshake: `<path d="M-78-16-25 34 0 9l25 25 53-50M-25 34l25 28 25-28" fill="none" stroke="${accent}" stroke-width="22" stroke-linejoin="round"/>`,
    lasso: `<ellipse cx="-8" cy="-16" rx="60" ry="45" fill="none" stroke="${accent}" stroke-width="12"/><path d="M32 18c45 34 6 72 40 91" fill="none" stroke="${accent}" stroke-width="12"/>`,
    corn: `<path d="M0-72C58-55 60 58 0 78-60 58-58-55 0-72Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M-30-50 30 55M30-50-30 55M-48-15h96M-45 25h90" stroke="${ink}" stroke-width="5" opacity=".6"/>`,
    phoenix: `<path d="M0 70C-74 40-56-20-13-66-4-34 14-25 26-4 51-28 55-48 52-62 91 5 68 57 0 70Z" fill="${accent}"/><path d="M-73 34C-30 17-22-5-14-35M73 34C30 17 22-5 14-35" fill="none" stroke="${ink}" stroke-width="12"/>`,
    poison: `<path d="M-40-68h80v20l-15 15v25l43 62c13 19 0 39-23 39h-90c-23 0-36-20-23-39l43-62v-25l-15-15Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-38 42h76" stroke="${ink}" stroke-width="8"/>`,
    shrink: `<path d="M-72-72 4 4M72 72-4-4M-72-72v52M-72-72h52M72 72V20M72 72H20" stroke="${accent}" stroke-width="13"/><circle r="24" fill="${ink}"/>`,
    swap: `<path d="M-78-25H48l-25-25M78 25H-48l25 25" fill="none" stroke="${accent}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`,
    party: `<path d="m-68 68 35-121L53 33Z" fill="${accent}" stroke="${ink}" stroke-width="8"/><path d="M-10-67 3-94M35-41l27-22M57 5l34-1" stroke="${ink}" stroke-width="10"/><circle cx="52" cy="-91" r="10" fill="${accent}"/>`,
    zombie: `<path d="M-70 45c22-75 118-86 140 0Z" fill="${accent}" stroke="${ink}" stroke-width="9"/><path d="M-45 18-65-15M-5 5-13-38M38 13 58-21" stroke="${ink}" stroke-width="10"/><circle cx="-27" cy="38" r="9" fill="${ink}"/><path d="M8 42h32" stroke="${ink}" stroke-width="9"/>`,
  };
  return shapes[motif] ?? shapes.star;
}

function renderCardArt(slug, name, motif) {
  const seed = hash(slug);
  const [ink, middle, gold, coral] = palettes[seed % palettes.length];
  const accent = seed % 2 ? gold : coral;
  const flip = seed % 3 === 0 ? -1 : 1;
  const tilt = ((seed >> 5) % 11) - 5;
  const eyeY = 247 + ((seed >> 8) % 16);
  const body = seed % 2 ? "#f1bd8b" : "#edc69d";
  const spotX = 55 + (seed % 390);
  const spotY = 55 + ((seed >> 8) % 230);
  const spot2X = 55 + ((seed >> 12) % 390);
  const spot2Y = 55 + ((seed >> 16) % 230);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 430" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(name)}</title>
  <desc id="desc">Original Unhinged Hedgehogs illustration: ${escapeXml(motif)}.</desc>
  <defs>
    <linearGradient id="bg" x1="24" y1="18" x2="476" y2="412" gradientUnits="userSpaceOnUse">
      <stop stop-color="${middle}"/>
      <stop offset="1" stop-color="${ink}"/>
    </linearGradient>
    <radialGradient id="glow"><stop stop-color="#fff8d8" stop-opacity=".72"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="500" height="430" rx="34" fill="url(#bg)"/>
  <circle cx="${spotX}" cy="${spotY}" r="${38 + (seed % 44)}" fill="${accent}" opacity=".22"/>
  <circle cx="${spot2X}" cy="${spot2Y}" r="${24 + ((seed >> 4) % 38)}" fill="#fff8d8" opacity=".16"/>
  <path d="M0 337c82-48 146-23 235 4 96 29 167 27 265-20v109H0Z" fill="${ink}" opacity=".45"/>
  <circle cx="255" cy="238" r="180" fill="url(#glow)" opacity=".38"/>
  <g transform="translate(250 208) rotate(${tilt}) scale(${flip} 1)">
    <path d="M-167 112-151 52l-47-28 57-22-23-57 62 12 8-64 53 37 37-54 33 56 57-30 4 65 64-5-27 59 56 26-49 40 35 54-65 7 11 63-61-21-23 61-46-46-45 47-24-60-61 23 9-64-65-5 34-55Z" fill="#242c3d"/>
    <ellipse cx="25" cy="87" rx="143" ry="111" fill="${body}"/>
    <circle cx="74" cy="${eyeY - 208}" r="12" fill="#182431"/>
    <circle cx="78" cy="${eyeY - 212}" r="3.5" fill="#fff8d8"/>
    <path d="M126 88c27-2 45 8 58 26-18 19-43 24-70 16Z" fill="#182431"/>
    <path d="M-20 126c38 25 82 27 116 3" fill="none" stroke="#a55756" stroke-width="9" stroke-linecap="round"/>
    <path d="M-65 145c-20 20-27 41-21 64M52 164c14 18 18 37 12 56" fill="none" stroke="#242c3d" stroke-width="13" stroke-linecap="round"/>
  </g>
  <g transform="translate(${seed % 2 ? 100 : 390} ${105 + ((seed >> 7) % 55)}) rotate(${tilt * -2}) scale(.68)">
    ${motifSvg(motif, ink, accent)}
  </g>
  <path d="M24 34c74-26 135-24 202 7M476 396c-78 22-143 17-206-12" fill="none" stroke="#fff8d8" stroke-width="7" stroke-linecap="round" opacity=".58"/>
</svg>
`;
}

mkdirSync(artDir, { recursive: true });
mkdirSync(dirname(catalogPath), { recursive: true });

for (const [slug, name, motif] of cards) {
  writeFileSync(resolve(artDir, `${slug}.svg`), renderCardArt(slug, name, motif));
}

const entries = cards
  .map(
    ([slug, name]) =>
      `  ${JSON.stringify(slug)}: { name: ${JSON.stringify(name)}, image: "/themes/unhinged-hedgehogs/cards/${slug}.svg" },`,
  )
  .join("\n");

const catalog = `// AUTO-GENERATED by scripts/gen-hedgehog-deck.mjs. Do not edit by hand.
// Original names and illustrations for the Unhinged Hedgehogs first-generation deck.

export interface HedgehogCardPresentation {
  name: string;
  image: string;
}

export const UNHINGED_HEDGEHOG_CARDS = {
${entries}
} as const satisfies Record<string, HedgehogCardPresentation>;
`;

writeFileSync(catalogPath, catalog);
execFileSync("vp", ["fmt", "--write", catalogPath], { stdio: "inherit" });
console.log(`Wrote ${cards.length} hedgehog illustrations and ${catalogPath}.`);
