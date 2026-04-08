import { NextResponse } from "next/server";
import { headers } from "next/headers";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  if (!AUTH_BASE) {
    return NextResponse.json({ error: "Referral API base not configured" }, { status: 500 });
  }

  const reqHeaders = await headers();
  const body = await request.json().catch(() => ({}));

  // Forward visitor IP + user-agent so Strapi gets real client info
  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const clientIp =
    reqHeaders.get("cf-connecting-ip") ||
    reqHeaders.get("x-real-ip") ||
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) {
    forwardHeaders["x-forwarded-for"] = clientIp;
    forwardHeaders["cf-connecting-ip"] = clientIp;
  }
  const ua = reqHeaders.get("user-agent");
  if (ua) {
    forwardHeaders["user-agent"] = ua;
  }

  const response = await fetch(`${AUTH_BASE}/api/referrals/track-click`, {
    method: "POST",
    headers: forwardHeaders,
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
