import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.QA_BASE_URL || "https://parade-displays-saturn-courier.trycloudflare.com";
const STRAPI_BASE_URL = process.env.QA_STRAPI_BASE_URL || process.env.STRAPI_BASE_URL || BASE_URL;
const ACCOUNT = process.env.QA_ACCOUNT || "test2@greenhub.co.uk";
const PASSWORD = process.env.QA_PASSWORD || "TestPass123!";
const ADMIN_TOKEN = process.env.QA_ADMIN_TOKEN || process.env.ADMIN_API_TOKEN;

if (!ADMIN_TOKEN) {
  throw new Error("QA_ADMIN_TOKEN (or ADMIN_API_TOKEN) is required");
}

const evidenceRoot = path.resolve("./docs/tests/evidence/2026-04-04/withdraw");
await fs.mkdir(evidenceRoot, { recursive: true });
const harPath = path.join(evidenceRoot, "withdraw.har");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  recordHar: { path: harPath, content: "embed" },
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("console", (msg) => console.log(`BROWSER: ${msg.type()} → ${msg.text()}`));

const NAV = { waitUntil: "domcontentloaded", timeout: 60000 };
const screenshot = async (name) => {
  const file = path.join(evidenceRoot, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved screenshot → ${file}`);
};

async function login() {
  await page.goto(`${BASE_URL}/account`, NAV);
  const payload = await page.evaluate(
    async ({ account, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: account, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || "API login failed");
      localStorage.setItem("bv:auth-token", data.jwt);
      localStorage.setItem("bv:auth-email", data?.user?.email || account);
      document.cookie = `bv:auth-token=${data.jwt}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=Lax`;
      return data;
    },
    { account: ACCOUNT, password: PASSWORD }
  );
  await page.waitForTimeout(1000);
  await page.goto(`${BASE_URL}/wallet`, NAV);
  await page.waitForURL(new RegExp(`^${BASE_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}/wallet`), {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  return payload;
}


const waitForMethodStep = () => page.waitForSelector("text=Select payout method", { timeout: 20000 });

async function submitWithdrawal(flow) {
  await page.goto(`${BASE_URL}/wallet/withdraw?${Date.now()}`, NAV);
  await page.waitForSelector("text=Withdraw funds", { timeout: 20000 });

  await page.locator('input[type="number"]').first().fill(flow.amount.toString());
  await screenshot(`${flow.key}-step1`);
  await page.getByRole("button", { name: /^Continue$/i }).click();

  await waitForMethodStep();
  const methodButton = flow.method === "bank"
    ? page.getByRole("button", { name: /Bank transfer/i })
    : page.getByRole("button", { name: /USDT transfer/i });
  await methodButton.first().click();

  if (flow.method === "bank") {
    await page.getByPlaceholder("GreenHub Ops").fill(flow.details.accountName);
    await page.getByPlaceholder("00000000").fill(flow.details.accountNumber);
    await page.getByPlaceholder("00-00-00").fill(flow.details.sortCode);
    await page.getByPlaceholder("Starling").fill(flow.details.bankName);
  } else {
    await page.getByPlaceholder("TRC20").fill(flow.details.network);
    await page.getByPlaceholder("T...").fill(flow.details.address);
  }
  await screenshot(`${flow.key}-step2`);
  await page.getByRole("button", { name: /^Continue$/i }).click();

  await page.waitForSelector("text=Review & confirm", { timeout: 20000 });
  if (flow.note) {
    await page.getByPlaceholder("Any context for concierge").fill(flow.note);
  }
  await page.getByRole("button", { name: /Submit request/i }).click();

  const heading = page.locator("h2", { hasText: "Reference" });
  await heading.waitFor({ timeout: 20000 });
  const headingText = (await heading.textContent()) || "";
  const reference = headingText.replace("Reference", "").trim();
  await screenshot(`${flow.key}-success`);
  return reference;
}

async function run() {
  await login();
  await screenshot("wallet");

  const flows = [
    {
      key: "bank",
      method: "bank",
      amount: 25,
      note: "QA automation bank",
      details: {
        accountName: "QA Runner",
        accountNumber: "00112233",
        sortCode: "10-20-30",
        bankName: "Starling",
      },
    },
    {
      key: "usdt",
      method: "crypto",
      amount: 30,
      note: "QA automation usdt",
      details: {
        network: "TRC20",
        address: "TYxQAtestWallet000000000000",
      },
    },
  ];

  const results = [];
  for (const flow of flows) {
    const reference = await submitWithdrawal(flow);
    results.push({ method: flow.method, amount: flow.amount, reference });
  }

  await page.goto(`${BASE_URL}/wallet/withdraw/history`, NAV);
  await screenshot("history");

  console.log("WITHDRAW_RESULTS=" + JSON.stringify(results));
  return results;
}

let results;
try {
  results = await run();
  console.log("SUCCESS:", results);
} catch (error) {
  console.error("GUI withdraw script failed", error);
  try {
    await screenshot("withdraw-error");
  } catch (_) {}
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
