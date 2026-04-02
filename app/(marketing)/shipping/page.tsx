import { HeroClassic, HowItWorksLocker } from "@/components/sections";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { lockerUsageTips, returnPolicies, shippingTimeline, supportSteps } from "@/data/fixtures/marketing";

export const metadata = {
  title: "Shipping & locker tips",
  description: "Understand GreenHub delivery cutoffs, locker SMS timing, and late fee policies."
};

export default function ShippingPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        highlight="HOME / SHIPPING"
        eyebrow="Shipping & locker tips"
        title="Same-evening lockers across Belfast & Derry"
        subtitle="Order before 20:00, receive QR + PIN before midnight, and follow the locker etiquette below to avoid late fees."
        primaryCta={{ label: "View locker map", href: "/how-it-works" }}
        secondaryCta={{ label: "Talk to concierge", href: "/contact" }}
        alignment="left"
        tone="soft"
        stats={[
          { label: "Cutoff", value: "20:00" },
          { label: "Courier window", value: "20:00-22:00" },
          { label: "Pickup", value: "22:00-00:00" }
        ]}
      />

      <TimelineSection />

      <HowItWorksLocker title={lockerUsageTips.title} steps={lockerUsageTips.steps} tip={lockerUsageTips.tip} />

      <ReturnPolicySection />

      <SupportStepsSection />

      <SupportCta />
    </div>
  );
}

function TimelineSection() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Timeline</p>
        <h2 className="text-3xl font-semibold text-white">Evening delivery rhythm</h2>
        <p className="text-sm text-ink-400">Every order follows the same cadence so you always know when to expect the locker SMS.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {shippingTimeline.map((milestone) => (
          <Card key={milestone.title} className="bg-night-900/70" padding="lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-night-800 text-lg font-semibold text-plum-200">
              {milestone.icon}
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-500">{milestone.window}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{milestone.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{milestone.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ReturnPolicySection() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Refund policy</p>
        <h2 className="text-3xl font-semibold text-white">How replacements or credits work</h2>
        <p className="text-sm text-ink-400">Match the locker pickup timer and send photos so concierge can escalate to the courier instantly.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {returnPolicies.map((policy) => (
          <Card key={policy.title} className="bg-night-900/60" padding="lg">
            <div className="text-2xl">{policy.icon}</div>
            <h3 className="mt-3 text-xl font-semibold text-white">{policy.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{policy.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SupportStepsSection() {
  return (
    <section className="space-y-4 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Support flow</p>
        <h2 className="text-3xl font-semibold text-white">Locker issue escalation checklist</h2>
      </header>
      <div className="space-y-4">
        {supportSteps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-night-900/60 p-4">
            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/80">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-ink-400">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportCta() {
  return (
    <section className="rounded-3xl border border-white/5 bg-night-950/80 p-6 text-center shadow-surface sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Need help?</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">Concierge can reroute lockers or confirm payments</h2>
      <p className="mt-2 text-sm text-ink-400">
        Message us before the cutoff if you need a different locker or want to pre-pay via wallet/USDT.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <a href="/contact">Contact page</a>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <a href="https://t.me/greenhub_concierge" target="_blank" rel="noreferrer">
            Telegram concierge
          </a>
        </Button>
      </div>
    </section>
  );
}
