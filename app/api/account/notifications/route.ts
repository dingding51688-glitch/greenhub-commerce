import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

/**
 * Resolve the Strapi base URL at request time (not module-load time).
 * Priority: STRAPI_DIRECT_URL > absolute AUTH/API base > fail.
 */
function getStrapiBase(): string {
  const direct = process.env.STRAPI_DIRECT_URL?.trim().replace(/\/$/, "");
  if (direct) return direct;

  // Fallback: if AUTH_BASE_URL is an absolute URL (e.g. https://cms.example.com)
  const authBase = (process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (/^https?:\/\//i.test(authBase)) return authBase.replace(/\/$/, "");

  throw new Error(
    "Cannot resolve Strapi URL. Set STRAPI_DIRECT_URL or an absolute NEXT_PUBLIC_AUTH_BASE_URL."
  );
}

function getToken(request?: NextRequest): string | null {
  // Try cookie first
  const cookieToken = cookies().get(AUTH_TOKEN_KEY)?.value;
  if (cookieToken) return cookieToken;

  // Fall back to Authorization header (client sends this)
  const authHeader = request?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

export async function GET(request: NextRequest) {
  let base: string;
  try {
    base = getStrapiBase();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward query params from the client
  const url = new URL(request.url);
  const strapiUrl = `${base}/api/notifications${url.search}`;

  try {
    const response = await fetch(strapiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    // If Strapi returns 404, return empty data instead of propagating the error
    // This happens when the notifications content-type doesn't exist yet
    if (response.status === 404) {
      return NextResponse.json({ data: [], meta: { pagination: { total: 0 } } });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (err: any) {
    console.error("[notifications/GET] Strapi fetch failed:", err.message);
    // Return empty data on network errors so the UI degrades gracefully
    return NextResponse.json({ data: [], meta: { pagination: { total: 0 } } });
  }
}

export async function PUT(request: NextRequest) {
  let base: string;
  try {
    base = getStrapiBase();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action === "markAll" ? "mark-all-read" : "mark-read";
  const payloadToSend =
    action === "mark-all-read"
      ? {}
      : { notificationIds: Array.isArray(body?.notificationIds) ? body.notificationIds : [] };

  try {
    const response = await fetch(`${base}/api/notifications/${action}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadToSend),
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 404) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (err: any) {
    console.error("[notifications/PUT] Strapi fetch failed:", err.message);
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }
}
