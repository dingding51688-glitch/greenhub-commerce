import { Button, Card } from "@/components/ui";
import { paymentRecommendations, PaymentPlan } from "@/data/fixtures/marketing";

export type PaymentRecommendationProps = {
  recommendation?: PaymentPlan;
  secondary?: PaymentPlan[];
  footnote?: string;
};

const PlanCard = ({ plan, featured }: { plan: PaymentPlan; featured?: boolean }) => (
  <Card
    variant={featured ? "elevated" : "outlined"}
    className={featured ? "border-plum-500/40 bg-night-900/80" : "bg-night-950"}
  >
    {plan.badge && (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-plum-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-plum-200">
        {plan.badge}
      </span>
    )}
    <div className="mt-3 flex items-baseline gap-2 text-white">
      <span className="text-3xl font-semibold">{plan.price}</span>
      <span className="text-sm text-ink-500">{plan.frequency}</span>
    </div>
    <h3 className="mt-3 text-xl font-semibold text-white">{plan.title}</h3>
    <p className="mt-2 text-sm text-ink-400">{plan.description}</p>
    <ul className="mt-4 space-y-2 text-sm text-ink-400">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-jade-400" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <a href={plan.cta.href} className="mt-6 block">
      <Button variant={featured ? "primary" : "secondary"} fullWidth>
        {plan.cta.label}
      </Button>
    </a>
  </Card>
);

export function PaymentRecommendation(props: Partial<PaymentRecommendationProps>) {
  const content = { ...paymentRecommendations, ...props } as PaymentRecommendationProps;

  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <header className="flex flex-col gap-2 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-ink-500">Payment</p>
        <h2 className="text-3xl font-semibold text-white">Recommended way to pay</h2>
        <p className="text-sm text-ink-400">
          Choose the plan that matches how often you visit the lockers. Switch or cancel anytime.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {content.recommendation && (
          <div className="lg:col-span-2">
            <PlanCard plan={content.recommendation} featured />
          </div>
        )}
        <div className="space-y-4">
          {content.secondary?.map((plan) => (
            <PlanCard key={plan.title} plan={plan} />
          ))}
        </div>
      </div>
      {content.footnote && (
        <p className="text-xs text-ink-500">{content.footnote}</p>
      )}
    </section>
  );
}

export default PaymentRecommendation;
