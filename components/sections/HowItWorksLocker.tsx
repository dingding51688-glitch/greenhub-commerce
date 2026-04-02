import { lockerFlow, LockerStep } from "@/data/fixtures/marketing";

export type LockerTip = {
  label: string;
  content: string;
};

export type HowItWorksLockerProps = {
  title?: string;
  steps?: LockerStep[];
  tip?: LockerTip;
};

export function HowItWorksLocker(props: Partial<HowItWorksLockerProps>) {
  const content = { ...lockerFlow, ...props } as Required<HowItWorksLockerProps>;

  return (
    <section className="rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-ink-500">Lockers</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{content.title}</h2>
        </div>
        {content.tip && (
          <div className="hidden rounded-2xl border border-jade-400/50 bg-jade-400/10 px-4 py-3 text-left text-sm text-jade-200 sm:block">
            <p className="text-xs uppercase tracking-wide text-jade-400">{content.tip.label}</p>
            <p className="text-jade-200">{content.tip.content}</p>
          </div>
        )}
      </div>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {content.steps.map((step) => (
          <li key={step.title} className="rounded-2xl border border-white/5 bg-night-900/50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-plum-600/20 text-lg font-semibold text-plum-300">
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-ink-400">{step.description}</p>
          </li>
        ))}
      </ol>
      {content.tip && (
        <div className="mt-6 rounded-2xl border border-jade-400/30 bg-jade-400/5 px-4 py-3 text-sm text-jade-200 sm:hidden">
          <p className="text-xs uppercase tracking-wide text-jade-400">{content.tip.label}</p>
          <p>{content.tip.content}</p>
        </div>
      )}
    </section>
  );
}

export default HowItWorksLocker;
