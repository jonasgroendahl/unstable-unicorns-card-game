// Render a scene module's cards to /tmp/uh-render/<group> and a contact sheet.
// Usage: node render.mjs <group>   (group = babies|basics|magicals|magic|upgrades|downgrades|instants|all)
import { mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const group = process.argv[2] ?? "all";

const modules = {
  babies: ["./scenes/babies.mjs", "BABIES"],
  basics: ["./scenes/basics.mjs", "BASICS"],
  magicals: ["./scenes/magicals.mjs", "MAGICALS"],
  magicals2: ["./scenes/magicals2.mjs", "MAGICALS2"],
  magic: ["./scenes/magic.mjs", "MAGIC"],
  upgrades: ["./scenes/upgrades.mjs", "UPGRADES"],
  downgrades: ["./scenes/downgrades.mjs", "DOWNGRADES"],
  instants: ["./scenes/instants.mjs", "INSTANTS"],
};

const groups = group === "all" ? Object.keys(modules) : [group];
let cards = {};
for (const g of groups) {
  const [path, exp] = modules[g];
  const mod = await import(path);
  cards = { ...cards, ...mod[exp] };
}

const outDir = resolve("/tmp/uh-render", group);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [slug, svg] of Object.entries(cards)) {
  writeFileSync(resolve(outDir, `${slug}.svg`), svg);
}

// contact sheet
const files = readdirSync(outDir)
  .filter((f) => f.endsWith(".svg"))
  .sort();
const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(files.length))));
const figs = files
  .map(
    (f) =>
      `<figure><div class="c">${readFileSync(resolve(outDir, f), "utf8")}</div><figcaption>${f.replace(/\.svg$/, "")}</figcaption></figure>`,
  )
  .join("");
const html = `<!doctype html><meta charset=utf-8><style>*{margin:0;box-sizing:border-box}body{background:#15121f;padding:22px;font:12px system-ui;color:#e9e4f5}.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:18px}figure{display:flex;flex-direction:column;gap:6px;align-items:center}.c{width:100%;aspect-ratio:500/430;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.45)}.c svg{width:100%;height:100%;display:block}figcaption{opacity:.65;text-align:center}</style><div class=g>${figs}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setViewportSize({ width: cols * 250 + 44, height: 100 });
await page.setContent(html, { waitUntil: "networkidle" });
const outPng = resolve("/tmp/uh-render", `${group}.png`);
await page.locator(".g").screenshot({ path: outPng });
await browser.close();
console.log(`Wrote ${files.length} cards → ${outPng}`);
