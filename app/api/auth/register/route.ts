import { resolveServerBase } from "@/lib/server-base";
import { NextResponse } from "next/server";

const RAW_AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
const AUTH_BASE = RAW_AUTH_BASE ? resolveServerBase(RAW_AUTH_BASE) : "";

function getStrapiDirect(): string {
  const direct = process.env.STRAPI_DIRECT_URL?.trim();
  if (direct) return direct.replace(/\/$/, "");
  if (/^https?:\/\//i.test(AUTH_BASE)) return AUTH_BASE;
  return "http://localhost:1337";
}

export async function POST(request: Request) {
  if (!AUTH_BASE) {
    return NextResponse.json({ error: { message: "Auth base URL is not configured" } }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { fullName, email, password, phone, postcode, telegramHandle, referralCode } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: { message: "Email and password are required" } }, { status: 400 });
  }

  const username = (fullName && typeof fullName === "string" && fullName.trim().length > 0 ? fullName.trim() : email).slice(0, 60);

  // 1. Register with Strapi
  try {
    const response = await fetch(`${AUTH_BASE}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "Registration failed";
      return NextResponse.json({ error: { message } }, { status: response.status });
    }

    const jwt = data?.jwt;
    const userId = data?.user?.id;

    // 2. Provision customer record (fire-and-forget, don't block registration)
    if (jwt && userId) {
      provisionCustomer(jwt, userId, email, fullName, referralCode, phone, postcode).catch((err) => {
        console.error("[register] Customer provisioning failed:", err?.message || err);
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: { message: "Unable to reach auth service" } }, { status: 502 });
  }
}

/**
 * After successful registration, call the Strapi direct URL to:
 * 1. Create customer record (if auto-provision hook didn't fire fast enough)
 * 2. Bind referral code
 */
async function provisionCustomer(
  jwt: string,
  userId: number,
  email: string,
  fullName?: string,
  referralCode?: string,
  phone?: string,
  postcode?: string
) {
  const base = getStrapiDirect();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };

  // Call /api/customers/me to trigger auto-provision via resolve-customer
  // This is a GET that will create the customer if it doesn't exist
  try {
    await fetch(`${base}/api/customers/me`, { headers, cache: "no-store" });
  } catch {
    // Ignore — the afterCreate lifecycle should have handled it
  }

  // Update customer with phone/postcode if provided
  const profileUpdates: Record<string, string> = {};
  if (phone && typeof phone === "string" && phone.trim()) profileUpdates.phone = phone.trim();
  if (postcode && typeof postcode === "string" && postcode.trim()) profileUpdates.postcode = postcode.trim().toUpperCase();

  if (Object.keys(profileUpdates).length > 0) {
    try {
      await fetch(`${base}/api/customers/me`, {
        method: "PUT",
        headers,
        body: JSON.stringify(profileUpdates),
      });
    } catch {
      // Non-critical
    }
  }

  // If referralCode provided, register the referral
  if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
    try {
      await fetch(`${base}/api/referrals/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });
    } catch {
      // Non-critical — referral binding can be retried
    }
  }
}
