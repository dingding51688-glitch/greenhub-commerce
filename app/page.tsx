import { HeroClassic, HowItWorksStore, ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent, homeHeroContent } from "@/data/fixtures/marketing";

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
      <HeroClassic {...homeHeroContent} />

      <FeaturedCollections />

      {/* ── How Locker Delivery Works ── */}
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">SECURE DELIVERY</p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-3xl">How locker delivery works</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-3 animate-stagger">
          {[
            {
              icon: "📦",
              title: "Enter your postcode",
              description: "At checkout, just type your postcode. We\u2019ll find the nearest secure locker automatically.",
            },
            {
              icon: "🔐",
              title: "Receive your access code",
              description: "Once dispatched, you\u2019ll get an email with the locker address and a unique access code.",
            },
            {
              icon: "✅",
              title: "Collect anytime",
              description: "Head to the locker whenever suits you. Open with your code\u00a0\u2014 no queues, no signatures.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="space-y-3 rounded-3xl border border-white/10 bg-card p-5"
            >
              <span className="text-3xl">{step.icon}</span>
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          🛡️ Secure &amp; Anonymous — No name required, no ID checks. Just your code.
        </div>
      </section>

      <div id="store-journey">
        <HowItWorksStore {...storeJourneyContent} />
      </div>

      <SupportCta />
    </div>
  );
}

function FeaturedCollections() {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
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
