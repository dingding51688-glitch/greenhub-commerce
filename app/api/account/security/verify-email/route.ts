import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStrapiBase(): string {
  const direct = process.env.STRAPI_DIRECT_URL?.trim().replace(/\/$/, "");
  if (direct) return direct;
  const authBase = (process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (/^https?:\/\//i.test(authBase)) return authBase.replace(/\/$/, "");
  throw new Error("Cannot resolve Strapi URL");
}

export async function POST(request: NextRequest) {
  let base: string;
  try {
    base = getStrapiBase();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${base}/api/account/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: body?.token }),
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (err: any) {
    console.error("[verify-email] Strapi fetch failed:", err.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
