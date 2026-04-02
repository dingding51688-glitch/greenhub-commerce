import Link from "next/link";
import { Button } from "@/components/ui";
import { heroClassicContent, HeroLink, HeroStat } from "@/data/fixtures/marketing";

export type HeroClassicProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  primaryCta?: HeroLink;
  secondaryCta?: HeroLink;
  stats?: HeroStat[];
};

export function HeroClassic(props: Partial<HeroClassicProps>) {
  const content = { ...heroClassicContent, ...props } as HeroClassicProps;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/5 bg-night-950 px-6 py-14 shadow-surface sm:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.45),_transparent_55%)]" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 text-center">
        {content.highlight && (
          <span className="inline-flex items-center justify-center self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-wide text-ink-400">
            {content.highlight}
          </span>
        )}
        <div className="space-y-4">
          {content.eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-500">
              {content.eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {content.title}
          </h1>
          {content.subtitle && <p className="text-lg text-ink-400 sm:text-xl">{content.subtitle}</p>}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {content.primaryCta && (
            <Link href={content.primaryCta.href} className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                {content.primaryCta.label}
              </Button>
            </Link>
          )}
          {content.secondaryCta && (
            <Link href={content.secondaryCta.href} className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full">
                {content.secondaryCta.label}
              </Button>
            </Link>
          )}
        </div>
        {content.stats && content.stats.length > 0 && (
          <dl className="grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {content.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-night-900/60 p-5 text-center">
                <dt className="text-sm uppercase tracking-wide text-ink-500">{stat.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export default HeroClassic;
