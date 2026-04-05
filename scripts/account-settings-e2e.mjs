import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.ACCOUNT_E2E_BASE_URL || "http://127.0.0.1:3001";
const ACCOUNT = process.env.ACCOUNT_E2E_EMAIL || "test2@greenhub.co.uk";
const PASSWORD = process.env.ACCOUNT_E2E_PASSWORD || "TestPass123!";
const TEMP_PASSWORD = process.env.ACCOUNT_E2E_TEMP_PASSWORD || "TestPass123!tmp";
const NEW_PHONE = process.env.ACCOUNT_E2E_PHONE || "+447700900222";
const EVIDENCE_DIR = path.join("docs/tests/evidence/2026-04-04/account-settings");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureDir = () => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
};

async function main() {
  ensureDir();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const step = async (label, fn) => {
    console.log(`-- ${label}`);
    await fn();
  };

  await step("login", async () => {
    await page.goto(`${BASE_URL}/account`, { waitUntil: "domcontentloaded" });
    await page.evaluate(async ({ account, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: account, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "login failed");
      }
      localStorage.setItem("bv:auth-token", payload.jwt);
      localStorage.setItem("bv:auth-email", payload?.user?.email || account);
      document.cookie = `bv:auth-token=${payload.jwt}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=Lax`;
    }, { account: ACCOUNT, password: PASSWORD });
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector('input[placeholder="+44 7700 900000"]', { timeout: 20000 });
  });

  const phoneInput = page.getByPlaceholder("+44 7700 900000");
  const originalPhone = await phoneInput.inputValue();

  await step("set phone", async () => {
    await phoneInput.fill(NEW_PHONE);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated").waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "account-phone-updated.png"), fullPage: true });
  });

  await step("clear phone", async () => {
    await page.getByRole("button", { name: "Clear" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated").waitFor({ timeout: 15000 });
  });

  await step("restore phone new", async () => {
    await phoneInput.fill(NEW_PHONE);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated").waitFor({ timeout: 15000 });
  });

  const newEmail = process.env.ACCOUNT_E2E_NEW_EMAIL || `test2+acct${Date.now()}@greenhub.co.uk`;

  await step("change email", async () => {
    await page.goto(`${BASE_URL}/account/security`, { waitUntil: "load" });
    await page.getByLabel("New email").fill(newEmail);
    await page.getByLabel("Confirm email").fill(newEmail);
    await page.getByLabel("Current password").first().fill(PASSWORD);
    await page.getByRole("button", { name: "Update email" }).click();
    await page.getByText("Email updated").waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "security-email-success.png"), fullPage: true });
  });

  await step("change password temp", async () => {
    await page.getByLabel("Current password").nth(1).fill(PASSWORD);
    await page.getByLabel("New password").fill(TEMP_PASSWORD);
    await page.getByLabel("Confirm password").fill(TEMP_PASSWORD);
    await page.getByRole("button", { name: "Update password" }).click();
    await page.getByText("Password updated").waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "security-password-change.png"), fullPage: true });
  });

  await step("change password revert", async () => {
    await page.getByLabel("Current password").nth(1).fill(TEMP_PASSWORD);
    await page.getByLabel("New password").fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByRole("button", { name: "Update password" }).click();
    await page.getByText("Password updated").waitFor({ timeout: 15000 });
  });

  await step("account screenshot", async () => {
    await page.goto(`${BASE_URL}/account`, { waitUntil: "load" });
    await sleep(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "account-email-updated.png"), fullPage: true });
  });

  await step("notifications screenshot", async () => {
    await page.goto(`${BASE_URL}/account/notifications`, { waitUntil: "load" });
    await sleep(1500);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "notifications-security.png"), fullPage: true });
  });

  fs.writeFileSync(path.join(EVIDENCE_DIR, "latest-email.txt"), newEmail);

  await step("revert email", async () => {
    await page.goto(`${BASE_URL}/account/security`, { waitUntil: "load" });
    await page.getByLabel("New email").fill(ACCOUNT);
    await page.getByLabel("Confirm email").fill(ACCOUNT);
    await page.getByLabel("Current password").first().fill(PASSWORD);
    await page.getByRole("button", { name: "Update email" }).click();
    await page.getByText("Email updated").waitFor({ timeout: 15000 });
  });

  await step("restore phone original", async () => {
    await page.goto(`${BASE_URL}/account`, { waitUntil: "load" });
    await phoneInput.fill(originalPhone || "");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated").waitFor({ timeout: 15000 });
  });

  await browser.close();
  console.log(`Evidence stored in ${EVIDENCE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
