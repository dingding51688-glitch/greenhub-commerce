import { HeroClassic, HowItWorksLocker } from "@/components/sections";
import Card from "@/components/ui/card";
import { contactChannels, inPostFlow } from "@/data/fixtures/marketing";

export const metadata = {
  title: "Contact GreenHub concierge",
  description: "Reach Belfast concierge via email, Telegram, or SMS for locker support."
};

export default function ContactPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        eyebrow="Support"
        title="Talk to concierge for lockers, payments, or refills"
        subtitle="We monitor Belfast and Derry lockers daily. Message us for pickup help, balance checks, or corporate requests."
        primaryCta={{ label: "Email concierge", href: "mailto:concierge@greenhub420.co.uk" }}
        secondaryCta={{ label: "Chat on Telegram", href: "https://t.me/greenhub_concierge" }}
        highlight="Average response < 5 min"
        stats={[
          { label: "Hours", value: "10:00-00:00" },
          { label: "Locker sites", value: "50+" },
          { label: "Success rate", value: "99%" }
        ]}
      />

      <ContactChannels />

      <HowItWorksLocker title={inPostFlow.title} steps={inPostFlow.steps} tip={inPostFlow.tip} />
    </div>
  );
}

function ContactChannels() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Channels</p>
        <h2 className="text-3xl font-semibold text-white">Pick the channel that suits you</h2>
        <p className="text-sm text-ink-400">Concierge replies fastest via Telegram, but email and SMS stay monitored all day.</p>
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
