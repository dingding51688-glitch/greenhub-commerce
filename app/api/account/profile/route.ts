import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";
import { resolveServerBase } from "@/lib/server-base";

const RAW_AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function requireBase() {
  if (!RAW_AUTH_BASE) throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
}

function getToken() {
  return cookies().get(AUTH_TOKEN_KEY)?.value;
}

export async function GET() {
  requireBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const base = resolveServerBase(RAW_AUTH_BASE);
  const response = await fetch(`${base}/api/account/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    next: { revalidate: 0 }
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}

export async function PUT(request: Request) {
  requireBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const base = resolveServerBase(RAW_AUTH_BASE);
  const response = await fetch(`${base}/api/account/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
