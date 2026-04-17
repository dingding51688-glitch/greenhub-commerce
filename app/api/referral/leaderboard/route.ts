import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || "https://cms.greenhub420.co.uk";
const TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_TOKEN || "";

async function strapiFetch(path: string) {
  const res = await fetch(`${STRAPI}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    next: { revalidate: 3600 }, // cache 1 hour
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    // Get all approved commission transactions with referrer info
    const txRes = await strapiFetch(
      "/api/commission-transactions?filters[review_status]=approved&populate=referrer&pagination[pageSize]=1000&sort=createdAt:desc"
    );

    const transactions = txRes?.data || [];

    // Aggregate by referrer
    const referrerMap = new Map<number, {
      id: number;
      name: string;
      totalCommission: number;
      orderCount: number;
      lastMonthCommission: number;
    }>();

    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    for (const tx of transactions) {
      const referrer = tx.referrer;
      if (!referrer) continue;

      const rid = referrer.id;
      const existing = referrerMap.get(rid) || {
        id: rid,
        name: referrer.name || referrer.full_name || "Anonymous",
        totalCommission: 0,
        orderCount: 0,
        lastMonthCommission: 0,
      };

      const amount = tx.amount || 0;
      existing.totalCommission += amount;
      existing.orderCount += 1;

      const txDate = new Date(tx.createdAt);
      if (txDate >= monthAgo) {
        existing.lastMonthCommission += amount;
      }

      referrerMap.set(rid, existing);
    }

    // Sort by total commission desc
    const sorted = Array.from(referrerMap.values())
      .sort((a, b) => b.totalCommission - a.totalCommission);

    // Build leaderboard with anonymized names
    const leaderboard = sorted.map((entry, i) => {
      // Anonymize: first char + "***"
      const name = entry.name;
      const display = name.length > 1 ? name.charAt(0).toUpperCase() + "***" : "A***";

      return {
        rank: i + 1,
        userAlias: display,
        ordersDriven: entry.orderCount,
        lifetimeCommission: Math.round(entry.totalCommission * 100) / 100,
        lastMonthCommission: Math.round(entry.lastMonthCommission * 100) / 100,
      };
    });

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (err: any) {
    console.error("Leaderboard API error:", err.message);
    // Fallback: return empty
    return NextResponse.json({ success: true, data: [] });
  }
}
