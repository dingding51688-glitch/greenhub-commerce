import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";
import { resolveServerBase } from "@/lib/server-base";

const RAW_AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  try {
    if (!RAW_AUTH_BASE) throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
    const token = cookies().get(AUTH_TOKEN_KEY)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const base = resolveServerBase(RAW_AUTH_BASE);
    const url = `${base}/api/account/unbind-telegram`;
    console.log("[unbind-telegram] Proxying to:", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    console.log("[unbind-telegram] Response status:", response.status, payload);
    return NextResponse.json(payload, { status: response.status });
  } catch (err: any) {
    console.error("[unbind-telegram] Error:", err.message, err.stack);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
