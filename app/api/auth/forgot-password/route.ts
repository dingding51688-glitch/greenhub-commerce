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
  const { email } = body || {};

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: { message: "Email is required" } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${AUTH_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Don't leak whether the email exists — always return 200
      // unless it's a server error
      if (response.status >= 500) {
        return NextResponse.json(
          { error: { message: "Unable to process request" } },
          { status: 502 }
        );
      }
    }

    // Always return ok to prevent email enumeration
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: { message: "Unable to reach auth service" } },
      { status: 502 }
    );
  }
}
