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

export async function GET() {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ linked: false }, { status: 200 });
  }
  const response = await fetch(`${AUTH_BASE}/api/telegram/link`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload?.data ?? payload, { status: response.status });
}

export async function DELETE() {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = await fetch(`${AUTH_BASE}/api/telegram/link`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload?.data ?? payload, { status: response.status });
}
