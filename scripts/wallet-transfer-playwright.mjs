import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const email = process.env.GH_EMAIL;
  const password = process.env.GH_PASSWORD;
  const recipientHandle = process.env.GH_HANDLE;
  const amount = process.env.GH_AMOUNT ?? "1";

  if (!email || !password || !recipientHandle) {
    throw new Error("GH_EMAIL, GH_PASSWORD, GH_HANDLE are required");
  }

  const evidenceDir = path.join(
    process.cwd(),
    "docs/tests/evidence/2026-04-06/wallet-transfer"
  );
  await fs.promises.mkdir(evidenceDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("request", (request) => {
    if (request.url().includes("/account")) {
      console.log("REQUEST", request.method(), request.url());
    }
  });

  await page.goto("https://www.greenhub420.co.uk/login", { waitUntil: "networkidle" });
  await page.fill('input[name="identifier"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.click('button[type="submit"]')
  ]);

  await page.goto("https://www.greenhub420.co.uk/wallet/transfer", { waitUntil: "networkidle" });
  await page.fill('input[name="handle"]', recipientHandle);
  await page.fill('input[name="amount"]', amount);
  await page.fill('input[name="memo"]', "QA transfer test");

  const transferResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/account") && response.request().method() === "POST"
  );

  await page.click('button[type="submit"]');
  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();
  console.log("Transfer status", transferResponse.status(), responseBody);

  if (!responseBody?.success) {
    throw new Error(`Transfer API returned error: ${JSON.stringify(responseBody)}`);
  }

  try {
    await page.getByText("转账成功").waitFor({ timeout: 10000 });
  } catch (err) {
    console.warn("Success banner not detected", err.message);
  }

  const timestamp = Date.now();
  await fs.promises.writeFile(
    path.join(evidenceDir, `transfer-response-${timestamp}.json`),
    JSON.stringify(responseBody, null, 2)
  );

  await page.screenshot({
    path: path.join(evidenceDir, `transfer-success-${timestamp}.png`),
    fullPage: true,
  });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
