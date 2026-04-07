import { Suspense } from "react";
import { HeroClassic, HowItWorksStore, ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent, homeHeroContent } from "@/data/fixtures/marketing";
import ReferralBanner from "@/components/ReferralBanner";

const storeJourneyContent = {
  eyebrow: "Store journey",
  title: "How ordering works",
  steps: [
    { icon: "①", title: "Reserve online", description: "Browse the catalog, add what you need to cart, and confirm checkout with wallet or card." },
    { icon: "②", title: "We prep & dispatch", description: "Support verifies payment, seals packaging, and texts you tracking + pickup instructions." },
    { icon: "③", title: "Collect or receive", description: "Head to the pickup point or accept the courier hand-off, then reply DONE so we can reset the slot." }
  ],
  tip: {
    label: "Service coverage",
    content: "Belfast & Derry orders dispatch same-evening; other NI postcodes leave our hub by 10:00 the next morning."
  }
};

export default function HomePage() {
  return (
    <div className="space-y-10 pb-20">
      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>
      <HeroClassic {...homeHeroContent} />

      <FeaturedCollections />

      <div id="store-journey">
        <HowItWorksStore {...storeJourneyContent} />
      </div>

      <SupportCta />
    </div>
  );
}

function FeaturedCollections() {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featuredCollectionsContent.map((collection) => (
        <ProductCategoryCard key={collection.title} {...collection} />
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
