import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.greenhub420.co.uk";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${STRAPI}/api/referrals/leaderboard`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
