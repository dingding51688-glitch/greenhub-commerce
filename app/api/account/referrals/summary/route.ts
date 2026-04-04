import { NextRequest, NextResponse } from "next/server";
import { resolveServerBase } from "@/lib/server-base";

export const dynamic = "force-dynamic";

const STRAPI_BASE = resolveServerBase(
  process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
);

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  try {
    const response = await fetch(`${STRAPI_BASE}/api/account/referrals/summary`, {
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || "Failed to fetch referral summary" },
        { status: response.status }
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: "Unable to reach backend" }, { status: 502 });
  }
}
