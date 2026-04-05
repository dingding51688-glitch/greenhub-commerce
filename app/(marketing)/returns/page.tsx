import { HeroClassic } from "@/components/sections";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { returnPolicies, supportSteps } from "@/data/fixtures/marketing";

export const metadata = {
  title: "Returns & refund policy",
  description: "Understand how GreenHub processes refunds, replacements, and support tickets."
};

export default function ReturnsPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        eyebrow="Returns"
        title="Orders protected with rapid refunds"
        subtitle="Report issues within 2 hours for account credits or replacements."
        primaryCta={{ label: "File a ticket", href: "/contact" }}
        secondaryCta={{ label: "Chat on Telegram", href: "https://t.me/greenhub_support" }}
        highlight="Turnaround < 4h"
      />

      <PolicySection />
      <SupportSteps />
      <SupportCta />
    </div>
  );
}

function PolicySection() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Policy</p>
        <h2 className="text-3xl font-semibold text-white">Refund rules at a glance</h2>
        <p className="text-sm text-ink-400">These match the policy shown on greenhub420.co.uk and in the onboarding emails.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {returnPolicies.map((policy) => (
          <Card key={policy.title} className="bg-night-900/70" padding="lg">
            <div className="text-3xl" aria-hidden="true">{policy.icon}</div>
            <h3 className="mt-2 text-xl font-semibold text-white">{policy.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{policy.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SupportSteps() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">How to request support</p>
        <h2 className="text-3xl font-semibold text-white">Follow these steps for a faster resolution</h2>
      </header>
      <ol className="space-y-4">
        {supportSteps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-white/5 bg-night-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Step {index + 1}</p>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-1 text-sm text-ink-400">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SupportCta() {
  return (
    <section className="rounded-3xl border border-white/5 bg-night-950/80 p-6 text-center shadow-surface sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Need help?</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">We refund within 4 hours once we have evidence</h2>
      <p className="mt-2 text-sm text-ink-400">Provide your order reference and any photos when you reach out.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <a href="/contact">Go to contact page</a>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <a href="https://t.me/greenhub_support" target="_blank" rel="noreferrer">
            Message on Telegram
          </a>
        </Button>
      </div>
    </section>
  );
}
