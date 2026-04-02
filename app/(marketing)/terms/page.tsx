import Link from "next/link";
import { HeroClassic } from "@/components/sections";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui";
import { termsSections } from "@/data/fixtures/marketing";

export const metadata = {
  title: "Terms & Conditions — GreenHub",
  description: "Locker membership terms, payment policies, and privacy notes for GreenHub members."
};

export default function TermsPage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic
        highlight="HOME / TERMS"
        eyebrow="Terms & Conditions"
        title="Locker access, payments, and privacy obligations"
        subtitle="Please review the latest locker membership terms. Reach out to concierge if you need clarification on any clause."
        primaryCta={{ label: "Contact concierge", href: "/contact" }}
        secondaryCta={{ label: "Support centre", href: "/support" }}
        alignment="left"
        tone="soft"
      />

      <TermsTableOfContents />

      <TermsSections />
    </div>
  );
}

function TermsTableOfContents() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {termsSections.map((section, index) => (
        <Card key={section.id} padding="lg" className="border-white/10 bg-night-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Section {String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{section.title}</h3>
          <p className="mt-3 text-sm text-ink-400">{section.summary}</p>
          <Link href={`#${section.id}`} className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-200 hover:text-emerald-100">
            Jump to section →
          </Link>
        </Card>
      ))}
    </section>
  );
}

function TermsSections() {
  return (
    <section className="space-y-8 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      {termsSections.map((section, index) => (
        <article key={section.id} id={section.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/80">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Section</p>
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            </div>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-ink-300">
            {section.body.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          {section.bullets && (
            <ul className="list-disc space-y-2 pl-5 text-sm text-ink-300">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <div className="pt-2">
            <Link href="/contact" className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-500">
              Need clarification? Contact concierge →
            </Link>
          </div>
          {index < termsSections.length - 1 && <div className="h-px bg-white/5" />}
        </article>
      ))}

      <div className="rounded-2xl border border-white/10 bg-night-900/70 p-6 text-center">
        <p className="text-sm text-ink-400">
          These placeholders will be replaced with the final legal draft. Submit additional clauses or edits via the concierge inbox.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="mailto:legal@greenhub.app">
            <Button className="w-full sm:w-auto">Send legal edits</Button>
          </Link>
          <Link href="/support">
            <Button variant="ghost" className="w-full sm:w-auto">
              View support articles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
