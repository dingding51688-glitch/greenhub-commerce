import { HeroClassic, PaymentRecommendation } from "@/components/sections";
import { faqGroups } from "@/data/fixtures/marketing";

export const metadata = {
  title: "GreenHub FAQ & support tips",
  description: "Answers about locker pickups, payments, verification, and concierge support."
};

export default function FaqPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        highlight="HOME / FAQ"
        eyebrow="FAQ"
        title="Everything you need to know before collecting"
        subtitle="Quick answers about verification, payments, and locker etiquette."
        primaryCta={{ label: "Talk to concierge", href: "/contact" }}
        secondaryCta={{ label: "Support centre", href: "/support" }}
        alignment="left"
        tone="soft"
      />

      <FaqGroups />

      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Payment & Locker tips</p>
          <h2 className="text-3xl font-semibold text-white">Choose the right plan and avoid pickup friction</h2>
          <p className="text-sm text-ink-400">Reserve+ holds lockers longer, while Pay-as-you-go suits spontaneous visits.</p>
        </header>
        <PaymentRecommendation footnote="Need invoicing for clinics or collectives? Email support@greenhub.app for enterprise options." />
      </section>
    </div>
  );
}

function FaqGroups() {
  return (
    <div className="space-y-6">
      {faqGroups.map((group) => (
        <section key={group.title} className="space-y-4 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Section</p>
            <h2 className="text-2xl font-semibold text-white">{group.title}</h2>
            <p className="text-sm text-ink-400">{group.description}</p>
          </header>
          <div className="space-y-3">
            {group.entries.map((entry) => (
              <details key={entry.question} className="group rounded-2xl border border-white/5 bg-night-900/60 p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold text-white">
                  <span>{entry.question}</span>
                  <span className="text-plum-300 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{entry.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
