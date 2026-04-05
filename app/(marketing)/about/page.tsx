import { HeroClassic } from "@/components/sections";
import Card from "@/components/ui/card";
import { aboutHighlights, coverageStats, supportCommitments } from "@/data/fixtures/marketing";

export const metadata = {
  title: "About GreenHub",
  description: "Why Northern Ireland members choose GreenHub for quality products and dedicated support."
};

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        eyebrow="About"
        title="Northern Ireland's premier online cannabis store"
        subtitle="We blend curated products, discreet delivery, and dedicated support so you can shop on your schedule."
        primaryCta={{ label: "How it works", href: "/how-it-works" }}
        secondaryCta={{ label: "Contact support", href: "/contact" }}
        highlight="Serving 3k+ members"
      />

      <HighlightsSection />
      <CoverageSection />
      <SupportSection />
    </div>
  );
}

function HighlightsSection() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Why choose GreenHub</p>
        <h2 className="text-3xl font-semibold text-white">We obsess over quality, logistics, and people</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {aboutHighlights.map((item) => (
          <Card key={item.title} className="bg-night-900/70" padding="lg">
            <div className="text-3xl" aria-hidden="true">{item.icon}</div>
            <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{item.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CoverageSection() {
  return (
    <section className="rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Coverage & partners</p>
          <h2 className="text-3xl font-semibold text-white">Delivery network + trusted partners</h2>
          <p className="text-sm text-ink-400">We place pickup points where members already spend their evenings and partner with couriers that keep parcels safe.</p>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          {coverageStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/5 bg-night-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-ink-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-sm text-ink-400">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupportSection() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Team & support</p>
        <h2 className="text-3xl font-semibold text-white">Support is NI-based and replies faster than DMs</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {supportCommitments.map((item) => (
          <Card key={item.title} className="bg-night-900/70" padding="lg">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{item.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
