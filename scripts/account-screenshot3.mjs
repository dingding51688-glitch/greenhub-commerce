import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const TOKEN = process.env.AUTH_TOKEN;
const DIR = "docs/tests/evidence/2026-04-05/account-ui";
fs.mkdirSync(DIR, { recursive: true });

if (!TOKEN) { console.error("AUTH_TOKEN required"); process.exit(1); }

async function setupAuth(page) {
  // Navigate to any page first to set localStorage on the right origin
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((token) => {
    localStorage.setItem("bv:auth-token", token);
    localStorage.setItem("bv:auth-email", "test2@greenhub.co.uk");
  }, TOKEN);
  // Now navigate to account
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(6000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ─── Mobile ───
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  mp.on("console", (msg) => {
    if (msg.type() === "error") console.log("[mobile err]", msg.text().slice(0, 200));
  });
  await setupAuth(mp);

  await mp.screenshot({ path: path.join(DIR, "01-mobile-overview.png") });
  console.log("✓ 01-mobile-overview");

  // Scroll to Balance
  const scrolled1 = await mp.evaluate(() => {
    for (const h2 of document.querySelectorAll("h2")) {
      if (h2.textContent === "Balance") { h2.scrollIntoView(); return true; }
    }
    return false;
  });
  console.log("  Balance found:", scrolled1);
  await mp.waitForTimeout(800);
  await mp.screenshot({ path: path.join(DIR, "02-mobile-balance.png") });
  console.log("✓ 02-mobile-balance");

  // Scroll to Commission Hub
  const scrolled2 = await mp.evaluate(() => {
    for (const h2 of document.querySelectorAll("h2")) {
      if (h2.textContent === "Commission Hub") { h2.scrollIntoView(); return true; }
    }
    return false;
  });
  console.log("  Commission found:", scrolled2);
  await mp.waitForTimeout(800);
  await mp.screenshot({ path: path.join(DIR, "03-mobile-commission.png") });
  console.log("✓ 03-mobile-commission");

  await mp.screenshot({ path: path.join(DIR, "04-mobile-full.png"), fullPage: true });
  console.log("✓ 04-mobile-full");

  // ─── Desktop ───
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  dp.on("console", (msg) => {
    if (msg.type() === "error") console.log("[desktop err]", msg.text().slice(0, 200));
  });
  await setupAuth(dp);
  await dp.screenshot({ path: path.join(DIR, "05-desktop-full.png"), fullPage: true });
  console.log("✓ 05-desktop-full");

  await browser.close();
  console.log("All done →", DIR);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
