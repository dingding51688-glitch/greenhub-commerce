"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { heroClassicContent, HeroLink } from "@/data/fixtures/marketing";

export type HeroClassicProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  primaryCta?: HeroLink;
  secondaryCta?: HeroLink;
  stats?: { label: string; value: string }[];
  bullets?: string[];
  alignment?: "left" | "center";
  tone?: "default" | "soft";
};

export function HeroClassic(props: Partial<HeroClassicProps>) {
  const content = { ...heroClassicContent, ...props } as HeroClassicProps;
  const alignment = content.alignment ?? "center";
  const tone = content.tone ?? "default";
  const sectionClasses = [
    "relative isolate overflow-hidden rounded-3xl border border-white/10 px-4 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-12",
    tone === "soft" ? "bg-[radial-gradient(circle_at_10%_0%,rgba(45,82,62,0.5),rgba(4,10,7,0.95))]" : "bg-hero-gradient"
  ].join(" ");
  const textAlignment = alignment === "left" ? "items-start text-left" : "items-center text-center";
  const ctaAlignment = alignment === "left" ? "sm:justify-start" : "sm:justify-center";

  return (
    <section className={sectionClasses}>
      <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 20% -10%, rgba(19,168,107,0.45), transparent 55%)" }} aria-hidden="true" />
      <div className={`relative z-10 mx-auto flex max-w-4xl flex-col gap-8 animate-fade-in-up ${textAlignment}`}>
        {content.highlight && (
          <span className={`inline-flex items-center justify-center rounded-pill border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[rgba(255,255,255,0.7)] ${alignment === "left" ? "self-start" : "self-center"}`}>
            {content.highlight}
          </span>
        )}
        <div className="space-y-4">
          {content.eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[rgba(255,255,255,0.6)]">
              {content.eyebrow}
            </p>
          )}
          <h1 className="text-[28px] font-semibold leading-[1.3] text-white sm:text-[40px]">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.8)] sm:text-lg">{content.subtitle}</p>
          )}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-2 text-sm text-white/80">
              {content.bullets.map((bullet) => (
                <li key={bullet} className={`flex w-full items-start gap-3 text-left ${alignment === "center" ? "justify-center" : ""}`}>
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`flex w-full flex-col gap-3 sm:flex-row ${ctaAlignment}`}>
          {content.primaryCta && (
            <Link href={content.primaryCta.href} className="w-full sm:w-auto">
              <Button size="lg" className="w-full min-h-[48px]">
                {content.primaryCta.label}
              </Button>
            </Link>
          )}
          {content.secondaryCta && (
            <Link href={content.secondaryCta.href} className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full min-h-[48px] text-[rgba(255,255,255,0.85)]">
                {content.secondaryCta.label}
              </Button>
            </Link>
          )}
        </div>
        {content.stats && content.stats.length > 0 && (
          <dl className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {content.stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[28px] sm:px-6 sm:py-4 sm:text-center">
                <dd className="text-xl font-semibold text-white sm:mt-3 sm:text-2xl">{stat.value}</dd>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-[rgba(255,255,255,0.6)] sm:order-first sm:tracking-[0.3em]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export default HeroClassic;
