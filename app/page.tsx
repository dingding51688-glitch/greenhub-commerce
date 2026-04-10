import Link from "next/link";
import { ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent } from "@/data/fixtures/marketing";
import { serverFetch } from "@/lib/server-api";

const CMS_BASE = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
function strapiMedia(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CMS_BASE}${path}`;
}

export default function HomePage() {
  return (
    <div className="space-y-5 pb-20 sm:space-y-10">
      {/* ── 1. Hero: Compact, action-oriented ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-white/10 px-5 py-8 sm:rounded-[40px] sm:px-12 sm:py-14">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden="true" />
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 20% -10%, rgba(19,168,107,0.45), transparent 55%)" }} aria-hidden="true" />
        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
            UK Delivery · InPost Lockers · Anonymous
          </p>
          <h1 className="mt-3 text-[22px] font-bold leading-tight text-white sm:text-[42px]">
            Order online.<br />
            Pick up anonymously.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Premium cannabis delivered to your nearest InPost locker. No name, no ID — just your pickup code.
          </p>
          <div className="mt-5 flex gap-2.5">
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full cta-gradient px-6 text-sm font-semibold uppercase tracking-wider text-white shadow-cta"
            >
              Shop Now
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold uppercase tracking-wider text-white/80"
            >
              How It Works
            </Link>
          </div>
          {/* Quick stats row */}
          <div className="mt-6 flex gap-4 overflow-x-auto text-center sm:gap-8">
            {[
              { val: "14,000+", label: "Pickup Points" },
              { val: "Same Day", label: "Dispatch" },
              { val: "100%", label: "Anonymous" },
            ].map((s) => (
              <div key={s.label} className="shrink-0">
                <p className="text-lg font-bold text-white sm:text-xl">{s.val}</p>
                <p className="text-[9px] uppercase tracking-wider text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Category Cards ── */}
      <FeaturedCollections />

      {/* ── 3. Quick Order Flow (3 steps, horizontal on mobile) ── */}
      <section className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible">
        {[
          { icon: "🛒", title: "Order", desc: "Browse menu & pay with wallet balance", color: "emerald" },
          { icon: "📦", title: "We Ship", desc: "Dispatched same day to your nearest InPost locker", color: "amber" },
          { icon: "🔓", title: "Collect", desc: "Enter your code, grab your parcel — done in 30 seconds", color: "purple" },
        ].map((step) => (
          <div key={step.title} className="w-[65vw] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:w-auto">
            <span className="text-2xl">{step.icon}</span>
            <h3 className="mt-2 text-sm font-bold text-white">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{step.desc}</p>
          </div>
        ))}
      </section>

      {/* ── 4. Trust Bar ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: "🔒", text: "Encrypted" },
          { icon: "📍", text: "14,000+" },
          { icon: "⚡", text: "Same Day" },
          { icon: "🎯", text: "No ID" },
        ].map((t) => (
          <div key={t.text} className="rounded-xl border border-white/8 bg-white/[0.02] py-2.5 text-center">
            <span className="text-lg">{t.icon}</span>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/50">{t.text}</p>
          </div>
        ))}
      </div>

      {/* ── 5. Earn Hub Promo ── */}
      <section className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-transparent px-5 py-5 sm:rounded-3xl sm:px-8 sm:py-8">
        <div className="flex items-start gap-4">
          <span className="text-3xl">💰</span>
          <div className="flex-1">
            <h2 className="text-base font-bold text-white sm:text-xl">Earn 15–25% commission</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-sm">
              Share your referral link. Every time a friend orders, you earn commission — paid instantly to your wallet.
            </p>
            <Link
              href="/account/commission"
              className="mt-3 inline-flex min-h-[36px] items-center justify-center rounded-full bg-purple-500 px-5 text-xs font-semibold text-white transition hover:bg-purple-400"
            >
              Open Earn Hub →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Payment Methods (compact) ── */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:rounded-3xl sm:px-8 sm:py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">We accept</p>
        <div className="mt-3 flex gap-3">
          {[
            { icon: "🏦", name: "Bank Transfer", tag: "5 min" },
            { icon: "💳", name: "Wallet", tag: "Instant" },
            { icon: "₮", name: "USDT", tag: "Crypto" },
          ].map((m) => (
            <div key={m.name} className="flex-1 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-center">
              <span className="text-lg">{m.icon}</span>
              <p className="mt-1 text-[10px] font-semibold text-white/70">{m.name}</p>
              <p className="text-[9px] text-emerald-400/70">{m.tag}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Support CTA ── */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5 sm:rounded-3xl sm:px-8 sm:py-8 sm:text-center">
        <h2 className="text-base font-bold text-white sm:text-xl">Need help ordering?</h2>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">Support available daily 09:00–21:00 GMT</p>
        <div className="mt-4 flex gap-2.5 sm:justify-center">
          <Link
            href="/how-it-works"
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full border border-white/20 text-xs font-semibold uppercase tracking-wider text-white/70 sm:flex-none sm:px-6"
          >
            Ordering Guide
          </Link>
          <Link
            href="/support"
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full cta-gradient text-xs font-semibold uppercase tracking-wider text-white sm:flex-none sm:px-6"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </div>
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
