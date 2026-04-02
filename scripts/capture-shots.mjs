import { chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://127.0.0.1:1338";
const APP_BASE = process.env.APP_BASE_URL || "http://127.0.0.1:3100";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "docs/frontend-shots/2026-04-02";
const AUTH_TOKEN_KEY = "bv:auth-token";
const AUTH_EMAIL_KEY = "bv:auth-email";

const MOBILE_SHOTS = [
  { name: "mobile-01-register.png", path: "/register", auth: false },
  { name: "mobile-02-search.png", path: "/search?q=berry", auth: true },
  { name: "mobile-03-product.png", path: "/products/berry-kush-3-5g", auth: true },
  { name: "mobile-04-checkout.png", path: "/checkout", auth: true }
];

const DESKTOP_SHOTS = [
  { name: "desktop-home.png", path: "/", auth: false },
  { name: "desktop-checkout.png", path: "/checkout", auth: true }
];

async function getJwt() {
  const response = await fetch(`${API_BASE}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "qa@example.com", password: "Password123!" })
  });
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  return response.json();
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const mobileDevice = devices["iPhone 14 Pro"];
  const { jwt, user } = await getJwt();

  const browser = await chromium.launch();
  try {
    const mobileContext = await browser.newContext({ ...mobileDevice });
    const authedMobileContext = await browser.newContext({ ...mobileDevice });
    await authedMobileContext.addInitScript(({ token, email, AUTH_TOKEN_KEY, AUTH_EMAIL_KEY }) => {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_EMAIL_KEY, email);
    }, { token: jwt, email: user.email, AUTH_TOKEN_KEY, AUTH_EMAIL_KEY });

    for (const shot of MOBILE_SHOTS) {
      const context = shot.auth ? authedMobileContext : mobileContext;
      const page = await context.newPage();
      await page.goto(`${APP_BASE}${shot.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUTPUT_DIR}/${shot.name}`, fullPage: true });
      await page.close();
    }

    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const authedDesktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await authedDesktopContext.addInitScript(({ token, email, AUTH_TOKEN_KEY, AUTH_EMAIL_KEY }) => {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_EMAIL_KEY, email);
    }, { token: jwt, email: user.email, AUTH_TOKEN_KEY, AUTH_EMAIL_KEY });

    for (const shot of DESKTOP_SHOTS) {
      const context = shot.auth ? authedDesktopContext : desktopContext;
      const page = await context.newPage();
      await page.goto(`${APP_BASE}${shot.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUTPUT_DIR}/${shot.name}`, fullPage: true });
      await page.close();
    }

    await mobileContext.close();
    await authedMobileContext.close();
    await desktopContext.close();
    await authedDesktopContext.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Screenshot capture failed", error);
  process.exitCode = 1;
});
