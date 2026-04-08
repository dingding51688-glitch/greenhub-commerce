import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

function getStrapiBase(): string {
  const direct = process.env.STRAPI_DIRECT_URL?.trim().replace(/\/$/, "");
  if (direct) return direct;
  const authBase = process.env.NEXT_PUBLIC_AUTH_BASE_URL?.trim().replace(/\/$/, "");
  if (authBase && /^https?:\/\//.test(authBase)) return authBase;
  throw new Error("No Strapi base URL configured");
}

/**
 * POST /api/support/tickets — create a support ticket
 */
export async function POST(request: NextRequest) {
  const base = getStrapiBase();
  const body = await request.json().catch(() => ({}));

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Forward client IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (clientIp) headers["x-forwarded-for"] = clientIp;

  const response = await fetch(`${base}/api/support-tickets`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}

/**
 * GET /api/support/tickets — get current user's tickets (alias for /mine)
 */
export async function GET(request: NextRequest) {
  const base = getStrapiBase();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${base}/api/support-tickets/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
