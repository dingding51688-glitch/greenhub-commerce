import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.QA_BASE_URL || "https://parade-displays-saturn-courier.trycloudflare.com";
const STRAPI_BASE_URL = process.env.QA_STRAPI_BASE_URL || process.env.STRAPI_BASE_URL || BASE_URL;
const ACCOUNT = process.env.QA_ACCOUNT || "test2@greenhub.co.uk";
const PASSWORD = process.env.QA_PASSWORD || "TestPass123!";
const ADMIN_TOKEN = process.env.QA_ADMIN_TOKEN || process.env.ADMIN_API_TOKEN;
const evidenceRoot = path.resolve("./docs/tests/evidence/2026-04-04/gui-postcode");
const harPath = path.join(evidenceRoot, "gui-postcode.har");
const screenshots = {
  wallet: "wallet.png",
  checkoutPostcode: "checkout-postcode.png",
  orderSuccess: "order-success.png",
  orderDetail: "order-detail.png",
  ordersList: "orders-list.png",
  notifications: "notifications.png",
  checkoutError: "checkout-error.png",
};

const escapeRegExp = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

await fs.mkdir(evidenceRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  recordHar: { path: harPath, content: "embed" },
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("console", (msg) => {
  console.log(`BROWSER: ${msg.type()} → ${msg.text()}`);
});

const screenshot = async (key) => {
  const file = path.join(evidenceRoot, screenshots[key]);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved screenshot → ${file}`);
};

const fillIfPresent = async (selector, value) => {
  const locator = page.locator(selector);
  if (await locator.count()) {
    await locator.first().fill(value);
  }
};

const clickIfPresent = async (role, name, options = {}) => {
  const locator = page.getByRole(role, { name });
  if (await locator.count()) {
    await locator.first().click(options);
  }
};

const NAV_OPTIONS = { waitUntil: "domcontentloaded", timeout: 60000 };
const goto = async (url) => page.goto(url, NAV_OPTIONS);

const waitForUrl = async (pattern) => {
  await page.waitForURL(pattern, { timeout: 60000, waitUntil: "domcontentloaded" });
};
const dashboardPattern = new RegExp(
  `^${escapeRegExp(BASE_URL)}/(?:(?:account|wallet)(?:/.*)?|)$`
);

try {
  console.log("1) Login");
  await goto(`${BASE_URL}/account`);
  await page.evaluate(
    async ({ account, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: account, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "API login failed");
      }
      localStorage.setItem("bv:auth-token", payload.jwt);
      localStorage.setItem("bv:auth-email", payload?.user?.email || account);
      document.cookie = `bv:auth-token=${payload.jwt}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=Lax`;
    },
    { account: ACCOUNT, password: PASSWORD }
  );
  await page.waitForTimeout(1000);
  await goto(`${BASE_URL}/wallet`);
  await waitForUrl(dashboardPattern);

  console.log("2) Wallet");
  await goto(`${BASE_URL}/wallet`);
  await screenshot("wallet");

  console.log("3) Checkout (postcode only)");
  await goto(`${BASE_URL}/checkout?product=berry-kush-3-5g`);
  await page.getByLabel(/Postcode/i).fill("BT1 1AA");
  const walletRadio = page.getByRole("radio", { name: /wallet balance/i });
  if (await walletRadio.count()) {
    await walletRadio.first().check();
  }
  await screenshot("checkoutPostcode");
  await page.getByRole("button", { name: /place order/i }).click();
  const orderUrlPattern = new RegExp(`^${escapeRegExp(BASE_URL)}/orders/.*`);
  await waitForUrl(orderUrlPattern);
  const orderUrl = page.url();
  await screenshot("orderSuccess");

  console.log("4) Orders list");
  await goto(`${BASE_URL}/orders`);
  await screenshot("ordersList");

  console.log("5) Order detail page");
  await goto(orderUrl);
  await screenshot("orderDetail");

  const orderReference = orderUrl.split("/").pop()?.split("?")[0];
  if (!orderReference) {
    throw new Error("Unable to parse order reference from URL");
  }
  console.log(`Order detail URL: ${orderUrl}`);

  if (!ADMIN_TOKEN) {
    throw new Error("QA_ADMIN_TOKEN or ADMIN_API_TOKEN required for locker assignment");
  }

  console.log("Assigning locker via admin endpoint");
  const lockerPayload = {
    lockerAddress: "Locker Hub BT1 — Unit 3, 12 Example St, Belfast",
    lockerAccessCode: "QA1234",
    lockerNotes: "Shelf B3, call concierge if issues",
  };

  const lockerResponse = await fetch(`${STRAPI_BASE_URL}/api/orders/${orderReference}/locker`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN,
    },
    body: JSON.stringify(lockerPayload),
  });
  const lockerJson = await lockerResponse.json().catch(() => ({}));
  if (!lockerResponse.ok) {
    console.error("Locker assignment failed", lockerJson);
    throw new Error("Failed to assign locker");
  }
  console.log("Locker assignment response:", lockerJson);

  console.log("6) Notifications");
  await goto(`${BASE_URL}/notifications`);
  await page.waitForTimeout(2000);
  await screenshot("notifications");
} catch (error) {
  console.error("GUI E2E script failed", error);
  try {
    await screenshot("checkoutError");
  } catch (_) {
    // ignore
  }
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
