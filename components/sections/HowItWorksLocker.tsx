import { lockerFlow, LockerStep } from "@/data/fixtures/marketing";

export type LockerTip = {
  label: string;
  content: string;
};

export type HowItWorksLockerProps = {
  title?: string;
  steps?: LockerStep[];
  tip?: LockerTip;
  eyebrow?: string;
};

export function HowItWorksLocker(props: Partial<HowItWorksLockerProps>) {
  const content = { eyebrow: "How it works", ...lockerFlow, ...props } as Required<HowItWorksLockerProps>;

  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#070707,#050505)] px-4 py-8 shadow-card sm:rounded-[40px] sm:px-10 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[rgba(255,255,255,0.6)]">
            {content.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-[1.3] text-white sm:text-[32px]">
            {content.title}
          </h2>
        </div>
        {content.tip && (
          <div className="hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-[rgba(255,255,255,0.8)] sm:block sm:rounded-[28px] sm:px-5 sm:py-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[rgba(255,255,255,0.6)]">
              {content.tip.label}
            </p>
            <p className="leading-relaxed">{content.tip.content}</p>
          </div>
        )}
      </div>
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {content.steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(13,91,63,0.25),rgba(5,5,5,0.9))] p-4 sm:flex-col sm:gap-0 sm:rounded-[32px] sm:p-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(19,168,107,0.2)] text-sm font-semibold text-white sm:mb-4 sm:h-12 sm:w-12 sm:text-base">
              {index + 1}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white sm:text-lg">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[rgba(255,255,255,0.75)] sm:mt-2">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      {content.tip && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[rgba(255,255,255,0.8)] sm:hidden">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[rgba(255,255,255,0.6)]">
            {content.tip.label}
          </p>
          <p className="mt-1 leading-relaxed">{content.tip.content}</p>
        </div>
      )}
    </section>
  );
}

export default HowItWorksLocker;
