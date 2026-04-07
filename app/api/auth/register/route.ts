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

  // Build registration payload — Strapi ignores unknown fields on the user model
  // but they're available in the afterCreate lifecycle event.params.data
  const registrationPayload: Record<string, unknown> = { username, email, password };
  if (phone && typeof phone === "string" && phone.trim()) registrationPayload.phone = phone.trim();
  if (postcode && typeof postcode === "string" && postcode.trim()) registrationPayload.postcode = postcode.trim().toUpperCase();
  if (referralCode && typeof referralCode === "string") registrationPayload.referralCode = referralCode.trim();

  // 1. Register with Strapi
  try {
    const response = await fetch(`${AUTH_BASE}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "Registration failed";
      return NextResponse.json({ error: { message } }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: { message: "Unable to reach auth service" } }, { status: 502 });
  }
}
