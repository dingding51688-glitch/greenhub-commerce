import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.greenhub420.co.uk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(`${STRAPI}/api/referrals/leaderboard`, {
      cache: "no-store",
    });
    const json = await res.json();
    return NextResponse.json(json, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
