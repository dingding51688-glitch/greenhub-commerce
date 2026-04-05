import { HeroClassic, HowItWorksLocker } from "@/components/sections";
import Card from "@/components/ui/card";
import { contactChannels, contactHeroDetails, inPostFlow } from "@/data/fixtures/marketing";

export const metadata = {
  title: "Contact GreenHub support",
  description: "Same-day responses via Telegram, email, and SMS for order queries, delivery updates, or wholesale help."
};

export default function ContactPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        highlight="HOME / CONTACT"
        eyebrow="Contact"
        title="Talk directly to the Green Hub team"
        subtitle="Same-day responses, 7 days a week. Ping us about orders, delivery ETA, or wholesale inventory."
        primaryCta={{ label: "Chat on Telegram", href: "https://t.me/greenhub_support" }}
        secondaryCta={{ label: "Email support", href: "mailto:support@greenhub.app" }}
        alignment="left"
        tone="soft"
      />

      <ContactHeroDetails />

      <ContactChannels />

      <HowItWorksLocker title={inPostFlow.title} steps={inPostFlow.steps} tip={inPostFlow.tip} />
    </div>
  );
}

function ContactHeroDetails() {
  return (
    <dl className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-white/85 sm:grid-cols-3">
      {contactHeroDetails.map((detail) => (
        <div key={detail.label} className="space-y-1">
          <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{detail.label}</dt>
          <dd>
            {detail.href ? (
              <a href={detail.href} className="text-base font-semibold text-white hover:text-emerald-200">
                {detail.value}
              </a>
            ) : (
              <span className="text-base font-semibold text-white">{detail.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ContactChannels() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Channels</p>
        <h2 className="text-3xl font-semibold text-white">Need a different route?</h2>
        <p className="text-sm text-ink-400">Pick the support channel that fits your scenario — Telegram for live chat, email for detailed threads, SMS for urgent pickup help.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {contactChannels.map((channel) => (
          <Card key={channel.title} className="bg-night-900/70" padding="lg">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">{channel.title}</h3>
              {channel.badge && (
                <span className="rounded-full border border-plum-500/40 bg-plum-500/10 px-3 py-1 text-xs font-semibold text-plum-200">
                  {channel.badge}
                </span>
              )}
            </div>
            {channel.href ? (
              <a href={channel.href} className="text-base font-semibold text-plum-200 hover:text-plum-100">
                {channel.detail}
              </a>
            ) : (
              <p className="text-base font-semibold text-plum-200">{channel.detail}</p>
            )}
            {channel.description && <p className="mt-2 text-sm text-ink-400">{channel.description}</p>}
          </Card>
        ))}
      </div>
    </section>
  );
}
