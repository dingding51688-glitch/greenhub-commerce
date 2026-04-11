import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — GreenHub 420",
  description: "Step-by-step guide to ordering, payment, and InPost locker pickup across the UK.",
};

/* ── Data ── */

const steps = [
  {
    num: 1,
    icon: "🔍",
    title: "Browse the menu",
    desc: "Explore Flowers, Pre-rolls, Vapes, Edibles, and Concentrates. Filter by category or use search to find exactly what you want.",
  },
  {
    num: 2,
    icon: "💳",
    title: "Top up your wallet",
    desc: "Add funds via bank transfer (GBP). Your balance is ready to spend instantly once confirmed. Minimum top-up is £20.",
  },
  {
    num: 3,
    icon: "🛒",
    title: "Add to cart & checkout",
    desc: "Select your items and quantities. At checkout, enter your postcode and choose from nearby InPost lockers and shops.",
  },
  {
    num: 4,
    icon: "📦",
    title: "We prepare your order",
    desc: "Our team packs and dispatches your parcel same day. Orders placed before 14:00 go out that afternoon.",
  },
  {
    num: 5,
    icon: "📱",
    title: "Get your pickup code",
    desc: "You'll receive an email with the locker address and your unique access code once the parcel is delivered to the locker.",
  },
  {
    num: 6,
    icon: "🔓",
    title: "Collect from the locker",
    desc: "Visit the InPost locker, enter your code. The door opens — grab your parcel. Done in 30 seconds. No ID required.",
  },
];

const paymentMethods = [
  {
    icon: "🏦",
    name: "Bank Transfer (GBP)",
    desc: "Transfer to our UK bank account. Include your GreenHub ID as the reference. Usually arrives within 5 minutes, up to 2 hours max.",
    tag: "Recommended",
  },
  {
    icon: "💰",
    name: "Wallet Balance",
    desc: "Already have funds in your GreenHub wallet? Checkout is instant. No waiting, no extra steps.",
    tag: "Instant",
  },
  {
    icon: "₮",
    name: "USDT (Tether)",
    desc: "Send USDT via TRC20 or ERC20 network. Double-check the amount before sending — incorrect amounts cannot be credited.",
    tag: "Crypto",
  },
];

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Orders placed before 14:00 are dispatched same day. You'll typically receive your locker code within 3–5 days.",
  },
  {
    q: "What if I miss the pickup window?",
    a: "InPost lockers hold parcels for 72 hours. If you miss it, contact support and we'll help arrange a solution.",
  },
  {
    q: "Is it anonymous?",
    a: "Yes. Just your postcode and email — no name, no ID, no signature required.",
  },
  {
    q: "What areas do you cover?",
    a: "All of the UK via the InPost locker network — over 16,000+ locker locations nationwide. Northern Ireland customers need to provide a real delivery address or a collection point.",
  },
  {
    q: "Can I get a refund?",
    a: "All sales are final. If there's a genuine issue with your order (wrong item, damage in transit), contact support within 24 hours.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your invite link from the Earn Hub. When friends place orders, you earn 15–25% commission on every purchase — credited to your wallet instantly.",
  },
  {
    q: "Is there a minimum order?",
    a: "No minimum order amount. However, the minimum wallet top-up is £20.",
  },
  {
    q: "How do withdrawals work?",
    a: "Go to Wallet → Withdraw. Minimum withdrawal is £100. A 3% processing fee applies. Funds arrive within 24 hours via UK bank transfer or USDT.",
  },
];

const trustPoints = [
  { icon: "🔒", title: "Encrypted & secure", desc: "All data is encrypted. We never share your information with third parties." },
  { icon: "📍", title: "16,000+ locker locations", desc: "InPost terminals across the UK, accessible 24/7." },
  { icon: "⚡", title: "Same-day dispatch", desc: "Order before 14:00 for same-day processing and dispatch." },
  { icon: "🎯", title: "No ID required", desc: "Fully anonymous pickup. Just your postcode and email — nothing else." },
];

/* ── Page ── */

export default function HowItWorksPage() {
  return (
    <div className="space-y-10 pb-20">
      {/* ── Hero ── */}
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-10 text-center shadow-card sm:rounded-[40px] sm:px-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">Ordering Guide</p>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-4xl">
          How It Works
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/60">
          From browsing to pickup — everything you need to know about ordering on GreenHub.
        </p>
        <div className="mx-auto mt-6 flex flex-wrap justify-center gap-6">
          {[
            { value: "16,000+", label: "Pickup points" },
            { value: "Same day", label: "Dispatch" },
            { value: "72h", label: "Collection window" },
            { value: "No ID", label: "Required" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-emerald-300">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/80">Step by Step</p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Your order journey</h2>

        <div className="relative mt-8 flex flex-col gap-5">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex gap-4 sm:gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg">
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-gradient-to-b from-amber-400/40 to-transparent" />
                )}
              </div>
              <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400/70">Step {step.num}</p>
                <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          🛡️ Secure &amp; Anonymous — No name required, no ID checks. Just your pickup code.
        </div>
      </section>

      {/* ── Payment Methods ── */}
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">Payment</p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">How to pay</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {paymentMethods.map((m) => (
            <div key={m.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{m.icon}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {m.tag}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{m.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Points ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {trustPoints.map((t) => (
          <div key={t.title} className="rounded-2xl border border-white/10 bg-card p-4 text-center">
            <span className="text-2xl">{t.icon}</span>
            <p className="mt-2 text-sm font-semibold text-white">{t.title}</p>
            <p className="mt-1 text-[11px] text-white/50">{t.desc}</p>
          </div>
        ))}
      </section>

      {/* ── FAQ ── */}
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#080808,#050505)] px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">FAQ</p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Common questions</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/8 bg-white/[0.02]">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-white">
                {f.q}
                <span className="ml-2 text-white/40 transition group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-4 text-sm leading-relaxed text-white/60">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Earn Section ── */}
      <section className="rounded-3xl border border-purple-400/20 bg-purple-400/5 px-5 py-8 shadow-card sm:rounded-[40px] sm:px-12 sm:py-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-300/80">Earn while you share</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Refer friends, earn 15–25%</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Share your unique invite link. Every time a friend places an order, you earn commission — credited to your wallet instantly.
            </p>
          </div>
          <Link
            href="/account/commission"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-purple-500 px-6 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            Open Earn Hub
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-8 text-center sm:rounded-[40px] sm:px-12">
        <h2 className="text-xl font-bold text-white sm:text-2xl">Ready to order?</h2>
        <p className="mt-2 text-sm text-white/60">Browse the menu and checkout in under 2 minutes.</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
          <Link
            href="/products"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full cta-gradient border border-transparent px-8 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-cta transition hover:opacity-95"
          >
            Shop Now
          </Link>
          <Link
            href="/support"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/30 px-8 text-sm font-semibold uppercase tracking-[0.1em] text-white/85 transition hover:border-white/60 hover:text-white"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
