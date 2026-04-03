import { NextResponse } from "next/server";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  if (!AUTH_BASE) {
    return NextResponse.json({ error: "Referral API base not configured" }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${AUTH_BASE}/api/referral-events/track-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
