import Link from "next/link";
import { ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent } from "@/data/fixtures/marketing";
import { serverFetch } from "@/lib/server-api";
import { UserStatusBar } from "@/components/home/UserStatusBar";
import { ProductCard } from "@/components/ProductCard";
import type { ProductRecord, ProductsResponse } from "@/lib/types";

const CMS_BASE = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
function strapiMedia(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CMS_BASE}${path}`;
}

export default async function HomePage() {
  return (
    <div className="space-y-5 pb-20 sm:space-y-10">
      {/* ── 1. Hero ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 px-4 py-6 sm:rounded-[40px] sm:px-12 sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] via-[#0d0d0d] to-[#0a0d1a]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 30% -20%, rgba(16,185,129,0.4), transparent 60%)" }} aria-hidden="true" />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 80% 120%, rgba(6,182,212,0.3), transparent 50%)" }} aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-emerald-400/8 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute -bottom-6 -left-10 h-20 w-20 rounded-full bg-cyan-400/8 blur-2xl" aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-emerald-400">Delivering across the UK</span>
          </div>

          <h1 className="text-[22px] font-bold leading-tight text-white sm:text-[42px]">
            Order online.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Pick up anonymously.</span>
          </h1>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/45 sm:text-sm sm:mt-3">
            Premium products delivered to 16,000+ InPost lockers &amp; collection points. No name, no ID.
          </p>

          <div className="mt-4 flex gap-2.5 sm:mt-5">
            <Link href="/products" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 text-sm font-semibold uppercase tracking-wider text-black shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition">
              Shop Now
            </Link>
            <Link href="/how-it-works" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold uppercase tracking-wider text-white/70 active:scale-[0.97] transition">
              How It Works
            </Link>
          </div>

          <div className="mt-5 flex gap-3 sm:gap-8">
            {[
              { val: "16,000+", label: "Lockers", icon: "📍" },
              { val: "Same Day", label: "Dispatch", icon: "⚡" },
              { val: "100%", label: "Anonymous", icon: "🔒" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-sm">{s.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white sm:text-sm">{s.val}</p>
                  <p className="text-[8px] uppercase tracking-wider text-white/30 sm:text-[9px]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Category Cards ── */}
      <FeaturedCollections />

      {/* ── 3. 🔥 Hot Products ── */}
      <HotProducts />

      {/* ── 4. 🎰 Lucky Draw — Lottery + Competition side by side ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🎰</span>
          <h2 className="text-base font-bold text-white sm:text-lg">Lucky Draw</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Daily Lottery */}
          <Link href="/lottery" className="relative isolate overflow-hidden rounded-xl border border-amber-400/12 p-3.5 active:scale-[0.97] transition">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent" aria-hidden="true" />
            <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-amber-400/10 blur-2xl" aria-hidden="true" />
            <div className="relative z-10">
              <span className="text-2xl">🎰</span>
              <p className="text-sm font-bold text-amber-300 mt-2">Daily £100</p>
              <p className="text-[9px] text-white/30 mt-0.5">Draw at 8PM daily</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[8px] text-emerald-400/70">Free via Telegram</span>
              </div>
            </div>
          </Link>

          {/* Competition */}
          <Link href="/competition" className="relative isolate overflow-hidden rounded-xl border border-purple-400/12 p-3.5 active:scale-[0.97] transition">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] to-transparent" aria-hidden="true" />
            <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-purple-400/10 blur-2xl" aria-hidden="true" />
            <div className="relative z-10">
              <span className="text-2xl">🎟️</span>
              <p className="text-sm font-bold text-purple-300 mt-2">Competition</p>
              <p className="text-[9px] text-white/30 mt-0.5">100 tickets · £2 each</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[8px] text-purple-400/70">🏆 Win up to £200</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 5. ⭐ Reviews ── */}
      <RecentReviews />

      {/* ── 6. Why Us — Earn Hub + Payment Methods combined ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-white/8 p-4 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] to-[#0a0d1a]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />
        <div className="relative z-10 space-y-4">
          {/* Earn Hub */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-400/15">
              <span className="text-lg">💰</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">Earn 15–25% Commission</h3>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/35">Share your referral link. Every order from friends = instant commission.</p>
              <Link href="/account/commission" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-purple-400/80 hover:text-purple-300">
                Open Earn Hub <span>→</span>
              </Link>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Payment Methods */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25 mb-2.5">Secure Payments</p>
            <div className="flex gap-2">
              {[
                { icon: "🏦", name: "Bank Transfer", tag: "5 min", border: "border-blue-400/10" },
                { icon: "💳", name: "Wallet", tag: "Instant", border: "border-emerald-400/10" },
                { icon: "₮", name: "USDT", tag: "Crypto", border: "border-purple-400/10" },
              ].map((m) => (
                <div key={m.name} className={`flex-1 rounded-lg border ${m.border} bg-white/[0.02] px-2.5 py-2 text-center`}>
                  <span className="text-base">{m.icon}</span>
                  <p className="mt-0.5 text-[9px] font-semibold text-white/50">{m.name}</p>
                  <p className="text-[8px] font-medium text-emerald-400/60">{m.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 🤖 AI Support ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-cyan-400/15 px-4 py-4 sm:px-6 sm:py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-blue-600/[0.04]" aria-hidden="true" />
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-cyan-400/8 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/15">
              <span className="text-lg">🤖</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#0a0a0a]" />
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">AI Support</h3>
            <p className="text-[9px] text-white/30">24/7 · Instant replies · Private &amp; secure</p>
          </div>
          <Link href="/support" className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-xs font-bold text-white shadow-lg shadow-cyan-500/15 active:scale-[0.97] transition">
            💬 Chat
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Hot Products Section ── */
async function HotProducts() {
  let products: ProductRecord[] = [];
  try {
    const data = await serverFetch<ProductsResponse>(
      "/api/products?populate=*&pagination[pageSize]=12&sort=rating:desc"
    );
    products = data.data?.filter((p) => (p.priceFrom ?? 0) > 0).slice(0, 6) ?? [];
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-white sm:text-lg">🔥 Popular Right Now</h2>
          <p className="text-[10px] text-white/35 mt-0.5">Top picks from our customers</p>
        </div>
        <Link href="/products" className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300">
          View All →
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
        {products.map((product) => (
          <div key={product.documentId} className="w-[42vw] shrink-0 snap-start sm:w-auto">
            <ProductCard product={product} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Recent Reviews Section ── */
async function RecentReviews() {
  let reviews: Array<{ rating: number; comment: string; displayName: string; productTitle: string; slug: string }> = [];

  const productMap: Record<number, { name: string; slug: string }> = {
    1: { name: "Stardawg", slug: "stardawg" },
    2: { name: "Amnesia Haze", slug: "amnesia-haze" },
    3: { name: "Gumbo", slug: "gumbo" },
    4: { name: "Lemon Cherry Gelato", slug: "lemon-cherry-gelato" },
    5: { name: "Candy Runtz", slug: "candy-runtz" },
    7: { name: "THC Premium Hash", slug: "thc-premium-hash" },
    8: { name: "Apple Tart", slug: "apple-tart" },
    18: { name: "Baby Yoda", slug: "baby-yoda" },
  };

  try {
    const strapiUrl = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
    const productIds = Object.keys(productMap);
    const results = await Promise.allSettled(
      productIds.map((id) =>
        fetch(`${strapiUrl}/api/reviews/product/${id}`, { next: { revalidate: 300 } }).then((r) => r.json())
      )
    );
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value?.data) {
        for (const r of result.value.data) {
          if (r.comment && r.comment.trim().length > 2) {
            const prod = productMap[Number(productIds[i])];
            reviews.push({
              rating: r.rating,
              comment: r.comment,
              displayName: r.displayName || "Customer",
              productTitle: prod?.name || "Product",
              slug: prod?.slug || "",
            });
          }
        }
      }
    }
    reviews = reviews.slice(0, 6);
  } catch {
    // Silent fail
  }

  if (reviews.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white sm:text-lg">⭐ Customer Reviews</h2>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible">
        {reviews.map((r, i) => (
          <Link key={i} href={`/products/${r.slug}`} className="relative isolate overflow-hidden w-[70vw] shrink-0 snap-start rounded-xl border border-amber-400/8 bg-white/[0.01] p-3.5 sm:w-auto active:scale-[0.97] transition">
            <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-yellow-400/5 blur-xl" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 flex items-center justify-center text-xs text-emerald-400 font-bold ring-1 ring-emerald-400/20">
                  {r.displayName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{r.displayName}</p>
                  <p className="text-[9px] text-white/25 truncate">{r.productTitle}</p>
                </div>
                <span className="text-xs">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= r.rating ? "text-yellow-400" : "text-white/10"}>★</span>
                  ))}
                </span>
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{r.comment}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function FeaturedCollections() {
  let collections: Array<{ title: string; label?: string; subtitle?: string; href: string; imageUrl?: string; imageAlt?: string; tone?: string }> = featuredCollectionsContent;

  try {
    const res = await serverFetch<{ data: any[] }>(
      "/api/collections?filters[featured]=true&populate=cover&sort=sortOrder:asc&pagination[pageSize]=6"
    );
    if (res.data?.length) {
      collections = res.data.map((c: any) => ({
        title: c.title,
        label: c.label || undefined,
        subtitle: c.subtitle || undefined,
        href: c.href || `/products?category=${c.slug}`,
        imageUrl: strapiMedia(c.cover?.url) || undefined,
        imageAlt: c.cover?.alternativeText || c.title,
        tone: c.tone || "green",
      }));
    }
  } catch {
    // Fallback to fixtures
  }

  return (
    <section className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5 animate-stagger">
      {collections.map((collection) => (
        <div key={collection.title} className="w-[42vw] shrink-0 snap-start sm:w-auto">
          <ProductCategoryCard {...collection} tone={collection.tone as any} />
        </div>
      ))}
    </section>
  );
}
