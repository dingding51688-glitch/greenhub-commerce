import { HeroClassic, ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent, homeHeroContent } from "@/data/fixtures/marketing";
import { serverFetch } from "@/lib/server-api";

const CMS_BASE = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
function strapiMedia(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CMS_BASE}${path}`;
}

const orderGuideSteps = [
  {
    step: 1,
    title: "Browse & checkout",
    description: "Pick your products, enter your postcode at checkout, and confirm payment via your wallet balance. We handle the rest.",
  },
  {
    step: 2,
    title: "Locker dispatch notification",
    description: "When the parcel arrives at the InPost locker, you receive an email + SMS with the pickup code.",
  },
  {
    step: 3,
    title: "Head to the assigned locker",
    description: "Visit the selected InPost terminal at any time that suits you within the 72h holding window.",
  },
  {
    step: 4,
    title: "Scan or enter the code",
    description: "Enter the pickup digits or scan the QR code at the kiosk. The door pops open and your parcel is inside.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic {...homeHeroContent} />

      <FeaturedCollections />

      {/* ── Order Guide ── */}
      <section id="store-journey" className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/80">ORDER GUIDE</p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-3xl">How your order arrives</h2>

        <div className="relative mt-8 flex flex-col gap-5 animate-stagger">
          {orderGuideSteps.map((step, i) => (
            <div key={step.step} className="relative flex gap-5">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-black">
                  {step.step}
                </div>
                {i < orderGuideSteps.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-gradient-to-b from-amber-400/40 to-transparent" />
                )}
              </div>
              {/* Card */}
              <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.02] p-5 card-hover">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400/70">Step {step.step}</p>
                <h3 className="mt-1.5 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          🛡️ Secure &amp; Anonymous — No name required, no ID checks. Just your code.
        </div>
      </section>

      <SupportCta />
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

function SupportCta() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 text-left shadow-card sm:rounded-[40px] sm:px-12 sm:py-10 sm:text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">Need help?</p>
      <h2 className="mt-2 text-xl font-semibold text-white sm:text-3xl">Questions about ordering?</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70 sm:mx-auto sm:max-w-md">
        Our support team is available 09:00–21:00 GMT daily. Check the ordering guide or reach out directly.
      </p>
      <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
        <a
          href="/how-it-works"
          className="inline-flex min-h-[48px] items-center justify-center rounded-pill border border-white/30 px-6 text-sm font-semibold uppercase tracking-[0.1em] text-white/85 transition hover:border-white/60 hover:text-white"
        >
          Ordering guide
        </a>
        <a
          href="/support"
          className="inline-flex min-h-[48px] items-center justify-center rounded-pill cta-gradient border border-transparent px-6 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-cta transition hover:opacity-95"
        >
          Contact support
        </a>
      </div>
    </section>
  );
}
