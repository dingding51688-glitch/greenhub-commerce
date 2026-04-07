import { resolveServerBase } from "@/lib/server-base";
import { NextResponse } from "next/server";

const RAW_AUTH_BASE =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
const AUTH_BASE = RAW_AUTH_BASE ? resolveServerBase(RAW_AUTH_BASE) : "";

export async function POST(request: Request) {
  if (!AUTH_BASE) {
    return NextResponse.json(
      { error: { message: "Auth base URL is not configured" } },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { code, password, passwordConfirmation } = body || {};

  if (!code || !password || !passwordConfirmation) {
    return NextResponse.json(
      { error: { message: "Code, password, and confirmation are required" } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${AUTH_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password, passwordConfirmation }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message || "Password reset failed. The link may have expired.";
      return NextResponse.json({ error: { message } }, { status: response.status });
    }

    return NextResponse.json({ ok: true, jwt: data.jwt });
  } catch {
    return NextResponse.json(
      { error: { message: "Unable to reach auth service" } },
      { status: 502 }
    );
  }
}
