import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function ensureBase() {
  if (!AUTH_BASE) {
    throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
  }
}

function getToken() {
  return cookies().get(AUTH_TOKEN_KEY)?.value;
}

export async function POST(request: Request) {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${AUTH_BASE}/api/telegram/confirm-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload?.data ?? payload, { status: response.status });
}
