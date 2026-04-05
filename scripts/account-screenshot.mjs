import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const ACCOUNT = "test2@greenhub.co.uk";
const PASSWORD = "TestPass123!";
const DIR = path.join("docs/tests/evidence/2026-04-05/account-ui");

fs.mkdirSync(DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Mobile viewport
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobile.newPage();

  // Login
  await mPage.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" });
  await mPage.evaluate(async ({ account, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: account, password }),
    });
    const data = await res.json();
    localStorage.setItem("bv:auth-token", data.jwt);
    localStorage.setItem("bv:auth-email", data.user?.email || account);
    document.cookie = `bv:auth-token=${data.jwt}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=Lax`;
  }, { account: ACCOUNT, password: PASSWORD });

  await mPage.reload({ waitUntil: "load" });
  await mPage.waitForTimeout(3000);

  // Screenshot 1: Overview (top of page)
  await mPage.screenshot({ path: path.join(DIR, "mobile-overview.png"), fullPage: false });
  console.log("✓ mobile-overview.png");

  // Screenshot 2: Full page
  await mPage.screenshot({ path: path.join(DIR, "mobile-full.png"), fullPage: true });
  console.log("✓ mobile-full.png");

  // Desktop viewport
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" });
  await dPage.evaluate(async ({ account, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: account, password }),
    });
    const data = await res.json();
    localStorage.setItem("bv:auth-token", data.jwt);
    localStorage.setItem("bv:auth-email", data.user?.email || account);
    document.cookie = `bv:auth-token=${data.jwt}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=Lax`;
  }, { account: ACCOUNT, password: PASSWORD });

  await dPage.reload({ waitUntil: "load" });
  await dPage.waitForTimeout(3000);
  await dPage.screenshot({ path: path.join(DIR, "desktop-full.png"), fullPage: true });
  console.log("✓ desktop-full.png");

  await browser.close();
  console.log(`Evidence in ${DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
