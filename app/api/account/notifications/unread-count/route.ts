import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

function getStrapiBase(): string {
  const direct = process.env.STRAPI_DIRECT_URL?.trim().replace(/\/$/, "");
  if (direct) return direct;
  const authBase = (process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (/^https?:\/\//i.test(authBase)) return authBase.replace(/\/$/, "");
  throw new Error("Cannot resolve Strapi URL.");
}

function getToken(request?: NextRequest): string | null {
  const cookieToken = cookies().get(AUTH_TOKEN_KEY)?.value;
  if (cookieToken) return cookieToken;
  const authHeader = request?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  let base: string;
  try { base = getStrapiBase(); } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const response = await fetch(`${base}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 404) return NextResponse.json({ success: true, unreadCount: 0 });
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ success: true, unreadCount: 0 });
  }
}
