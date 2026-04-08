import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStrapiBase(): string {
  return (process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk").replace(/\/$/, "");
}

/** POST /api/admin/campaigns/:id/send */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = getStrapiBase();
  const token = process.env.ADMIN_API_TOKEN || "";

  const res = await fetch(`${base}/api/admin/campaigns/${id}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
