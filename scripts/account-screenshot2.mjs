import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const DIR = "docs/tests/evidence/2026-04-05/account-ui";
fs.mkdirSync(DIR, { recursive: true });

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="text"]', "test2@greenhub.co.uk");
  await page.fill('input[type="password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  // Wait for welcome screen + redirect delay
  await page.waitForTimeout(5000);
  // Force navigate to account page
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000); // Let all SWR settle
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  mp.on("console", (msg) => { if (msg.type() === "error") console.log("[mobile error]", msg.text()); });
  await login(mp);

  // Overview viewport screenshot
  await mp.screenshot({ path: path.join(DIR, "01-mobile-overview.png"), fullPage: false });
  console.log("✓ 01-mobile-overview.png");

  // Scroll to balance
  await mp.evaluate(() => {
    const h2s = document.querySelectorAll("h2");
    for (const h2 of h2s) {
      if (h2.textContent === "Balance") { h2.scrollIntoView({ behavior: "instant" }); break; }
    }
  });
  await mp.waitForTimeout(1000);
  await mp.screenshot({ path: path.join(DIR, "02-mobile-balance.png"), fullPage: false });
  console.log("✓ 02-mobile-balance.png");

  // Scroll to commission hub
  await mp.evaluate(() => {
    const h2s = document.querySelectorAll("h2");
    for (const h2 of h2s) {
      if (h2.textContent === "Commission Hub") { h2.scrollIntoView({ behavior: "instant" }); break; }
    }
  });
  await mp.waitForTimeout(1000);
  await mp.screenshot({ path: path.join(DIR, "03-mobile-commission.png"), fullPage: false });
  console.log("✓ 03-mobile-commission.png");

  // Full page
  await mp.screenshot({ path: path.join(DIR, "04-mobile-full.png"), fullPage: true });
  console.log("✓ 04-mobile-full.png");

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  dp.on("console", (msg) => { if (msg.type() === "error") console.log("[desktop error]", msg.text()); });
  await login(dp);
  await dp.screenshot({ path: path.join(DIR, "05-desktop-full.png"), fullPage: true });
  console.log("✓ 05-desktop-full.png");

  await browser.close();
  console.log("Done! Evidence in", DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
