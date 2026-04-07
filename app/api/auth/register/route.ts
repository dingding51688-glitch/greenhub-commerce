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
  const { fullName, email, password, phone, postcode, referralCode } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: { message: "Email and password are required" } }, { status: 400 });
  }

  const username = (fullName && typeof fullName === "string" && fullName.trim().length > 0 ? fullName.trim() : email).slice(0, 60);

  // 1. Register with Strapi (only send fields Strapi expects)
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

    // 2. After registration, update customer profile with phone/postcode
    // The afterCreate lifecycle already provisioned the customer
    if (jwt) {
      updateCustomerProfile(jwt, phone, postcode, referralCode).catch((err) => {
        console.error("[register] Post-registration update failed:", err?.message || err);
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: { message: "Unable to reach auth service" } }, { status: 502 });
  }
}

/**
 * After registration, update customer with extra fields via Strapi API.
 * Uses wallet/balance first to trigger auto-provision, then updates profile.
 */
async function updateCustomerProfile(
  jwt: string,
  phone?: string,
  postcode?: string,
  referralCode?: string
) {
  const base = getStrapiDirect();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };

  // Trigger auto-provision by hitting wallet balance (resolveCustomerId creates customer)
  try {
    await fetch(`${base}/api/wallet/balance`, { headers, cache: "no-store" });
  } catch {
    // Ignore
  }

  // Wait a moment for customer creation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update phone/postcode via account profile endpoint
  const updates: Record<string, string> = {};
  if (phone && typeof phone === "string" && phone.trim()) updates.phone = phone.trim();
  if (postcode && typeof postcode === "string" && postcode.trim()) updates.postcode = postcode.trim().toUpperCase();

  if (Object.keys(updates).length > 0) {
    try {
      await fetch(`${base}/api/account/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });
    } catch {
      // Non-critical
    }
  }

  // Referral binding
  if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
    try {
      await fetch(`${base}/api/referrals/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });
    } catch {
      // Non-critical
    }
  }
}
