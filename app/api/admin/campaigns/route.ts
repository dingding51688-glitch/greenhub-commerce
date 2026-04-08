import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStrapiBase(): string {
  return (process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk").replace(/\/$/, "");
}

function getAdminToken(): string {
  return process.env.ADMIN_API_TOKEN || "";
}

function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-admin-token": getAdminToken(),
  };
}

/** GET /api/admin/campaigns — list campaigns */
export async function GET(request: NextRequest) {
  const base = getStrapiBase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const qs = status ? `?status=${status}` : "";

  const res = await fetch(`${base}/api/admin/campaigns${qs}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/admin/campaigns — create campaign */
export async function POST(request: NextRequest) {
  const base = getStrapiBase();
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${base}/api/admin/campaigns`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
