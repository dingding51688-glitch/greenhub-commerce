import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";
import { resolveServerBase } from "@/lib/server-base";

const RAW_AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  if (!RAW_AUTH_BASE) throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
  const token = cookies().get(AUTH_TOKEN_KEY)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const base = resolveServerBase(RAW_AUTH_BASE);
  const response = await fetch(`${base}/api/account/unbind-telegram`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
