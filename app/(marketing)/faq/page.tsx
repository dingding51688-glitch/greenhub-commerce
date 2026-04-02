import { HeroClassic, PaymentRecommendation } from "@/components/sections";
import { faqEntries } from "@/data/fixtures/marketing";

export const metadata = {
  title: "GreenHub FAQ & support tips",
  description: "Answers about locker pickups, payments, verification, and concierge support."
};

export default function FaqPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        eyebrow="FAQ"
        title="Everything you need to know before collecting"
        subtitle="Quick answers about verification, payments, and locker etiquette."
        primaryCta={{ label: "Contact concierge", href: "/contact" }}
        secondaryCta={{ label: "Order checklist", href: "/how-it-works" }}
        highlight="Updated daily"
      />

      <FaqAccordion />

      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Payment & Locker tips</p>
          <h2 className="text-3xl font-semibold text-white">Choose the right plan and avoid pickup friction</h2>
          <p className="text-sm text-ink-400">Reserve+ holds lockers longer, while Pay-as-you-go suits spontaneous visits.</p>
        </header>
        <PaymentRecommendation footnote="Need invoicing for clinics or collectives? Email concierge@greenhub420.co.uk for enterprise options." />
      </section>
    </div>
  );
}

function FaqAccordion() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Questions</p>
        <h2 className="text-3xl font-semibold text-white">Popular locker + payment questions</h2>
        <p className="text-sm text-ink-400">Tap to expand any answer. Concierge updates this list whenever policies change.</p>
      </header>
      <div className="space-y-3">
        {faqEntries.map((entry) => (
          <details key={entry.question} className="group rounded-2xl border border-white/5 bg-night-900/60 p-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-semibold text-white">
              <span>{entry.question}</span>
              <span className="text-plum-300 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-400">{entry.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
