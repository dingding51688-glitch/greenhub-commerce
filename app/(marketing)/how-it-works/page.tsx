import Link from "next/link";
import { HeroClassic, HowItWorksLocker, PaymentRecommendation } from "@/components/sections";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { faqCategories } from "@/data/fixtures/faq";

export const metadata = {
  title: "How GreenHub works",
  description: "Step-by-step guide for ordering, payments, and delivery across Northern Ireland."
};

export default function HowItWorksPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        highlight="HOME / HOW IT WORKS"
        eyebrow="Order Guide"
        title="Order online, collect from your nearest InPost locker"
        subtitle="Follow three simple steps to place your order, confirm payment, and collect your parcel from an InPost locker whenever it suits you."
        primaryCta={{ label: "Create an account", href: "/register" }}
        secondaryCta={{ label: "Browse products", href: "/products" }}
        tone="soft"
        alignment="left"
        stats={[
          { label: "Pickup points", value: "50+" },
          { label: "Avg. prep", value: "18 min" },
          { label: "Collection window", value: "120 min" }
        ]}
      />

      <HowItWorksLocker />

      <GuideCta />

      <FaqSection />

      <PaymentRecommendation footnote="Need bespoke billing for teams or patients? Email support@greenhub420.co.uk for enterprise accounts." />
    </div>
  );
}

function FaqSection() {
  const deliveryFaq = faqCategories.find((category) => category.id === "delivery")?.entries.slice(0, 4) ?? [];
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">FAQ</p>
        <h2 className="text-3xl font-semibold text-white">Delivery, payments, and support</h2>
        <p className="text-sm text-ink-400">Short answers to the questions our support team receives most often.</p>
      </header>
      <div className="space-y-4">
        {deliveryFaq.map((item) => (
          <Card key={item.id} padding="sm" className="bg-night-900/70">
            <h3 className="text-lg font-semibold text-white">{item.question}</h3>
            <p className="mt-2 text-sm text-ink-400">{item.answer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function GuideCta() {
  return (
    <section className="rounded-3xl border border-white/10 bg-night-950/70 p-6 shadow-surface sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">New here?</p>
        <h2 className="text-2xl font-semibold text-white">Follow the getting started guide</h2>
        <p className="text-sm text-white/70">Step-by-step walkthrough covering payments, collection codes, and what to do if something goes wrong.</p>
      </div>
      <Button asChild className="mt-4 sm:mt-0">
        <Link href="/how-it-works">View full guide</Link>
      </Button>
    </section>
  );
}
