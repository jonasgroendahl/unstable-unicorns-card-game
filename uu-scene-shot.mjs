import { chromium } from "playwright-core";

const BASE = "http://localhost:3008";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

const resp = await page.goto(`${BASE}/neightest`, { waitUntil: "networkidle" });
console.log("status", resp?.status());

const found = await page.locator(".uu-neighed-scene").count();
console.log("scene present:", found);
if (found) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/tmp/scene-slam.png" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/scene-settled.png" });
  console.log("captured");
} else {
  await page.screenshot({ path: "/tmp/scene-missing.png" });
  console.log("scene not found; saved page");
}
await browser.close();
console.log("done");
