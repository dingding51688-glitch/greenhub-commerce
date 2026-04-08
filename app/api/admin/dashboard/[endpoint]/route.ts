import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const STRAPI_BASE = (process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk").replace(/\/$/, "");
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "Dd91239123!!";

function verifyToken(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  const expected = crypto.createHmac("sha256", ADMIN_PASS).update("admin-dashboard-session").digest("hex");
  return token === expected;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ endpoint: string }> }) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await params;
  const allowed = ["stats", "recent", "leaderboard"];
  if (!allowed.includes(endpoint)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resp = await fetch(`${STRAPI_BASE}/api/admin/dashboard/${endpoint}`, {
    headers: { "x-admin-token": ADMIN_API_TOKEN },
    cache: "no-store",
  });

  const data = await resp.json();
  return NextResponse.json(data);
}
