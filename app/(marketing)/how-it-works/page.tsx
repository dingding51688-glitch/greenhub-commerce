import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — GreenHub 420",
  description: "Step-by-step guide to ordering, payment, and InPost locker pickup across the UK.",
};

/* ── Data ── */

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Browse the menu",
    desc: "Explore Flowers, Pre-rolls, Vapes, Edibles, and Concentrates. Filter by category or use search to find exactly what you want.",
    gradient: "from-emerald-500/15 to-transparent",
    border: "border-emerald-400/15",
    glow: "bg-emerald-400/10",
    numColor: "text-emerald-400/50",
    dotColor: "bg-emerald-400",
  },
  {
    num: "02",
    icon: "💳",
    title: "Top up your wallet",
    desc: "Add funds via bank transfer (GBP). Your balance is ready to spend instantly once confirmed. Minimum top-up is £20.",
    gradient: "from-cyan-500/15 to-transparent",
    border: "border-cyan-400/15",
    glow: "bg-cyan-400/10",
    numColor: "text-cyan-400/50",
    dotColor: "bg-cyan-400",
  },
  {
    num: "03",
    icon: "🛒",
    title: "Add to cart & checkout",
    desc: "Select your items and quantities. At checkout, enter your postcode and choose from nearby InPost lockers and shops.",
    gradient: "from-blue-500/15 to-transparent",
    border: "border-blue-400/15",
    glow: "bg-blue-400/10",
    numColor: "text-blue-400/50",
    dotColor: "bg-blue-400",
  },
  {
    num: "04",
    icon: "📦",
    title: "We prepare your order",
    desc: "Our team packs and dispatches your parcel same day. Orders placed before 14:00 go out that afternoon.",
    gradient: "from-amber-500/15 to-transparent",
    border: "border-amber-400/15",
    glow: "bg-amber-400/10",
    numColor: "text-amber-400/50",
    dotColor: "bg-amber-400",
  },
  {
    num: "05",
    icon: "📱",
    title: "Get your pickup code",
    desc: "You'll receive an email with the locker address and your unique access code once the parcel is delivered to the locker.",
    gradient: "from-violet-500/15 to-transparent",
    border: "border-violet-400/15",
    glow: "bg-violet-400/10",
    numColor: "text-violet-400/50",
    dotColor: "bg-violet-400",
  },
  {
    num: "06",
    icon: "🔓",
    title: "Collect from the locker",
    desc: "Visit the InPost locker, enter your code. The door opens — grab your parcel. Done in 30 seconds. No ID required.",
    gradient: "from-emerald-500/15 to-transparent",
    border: "border-emerald-400/15",
    glow: "bg-emerald-400/10",
    numColor: "text-emerald-400/50",
    dotColor: "bg-emerald-400",
  },
];

const paymentMethods = [
  {
    icon: "🏦",
    name: "Bank Transfer (GBP)",
    desc: "Transfer to our UK bank account. Include your GreenHub ID as the reference. Usually arrives within 5 minutes, up to 2 hours max.",
    tag: "Recommended",
    tagColor: "bg-emerald-400/10 text-emerald-400",
  },
  {
    icon: "💰",
    name: "Wallet Balance",
    desc: "Already have funds in your GreenHub wallet? Checkout is instant. No waiting, no extra steps.",
    tag: "Instant",
    tagColor: "bg-cyan-400/10 text-cyan-400",
  },
  {
    icon: "₮",
    name: "USDT (Tether)",
    desc: "Send USDT via TRC20 or ERC20 network. Double-check the amount before sending — incorrect amounts cannot be credited.",
    tag: "Crypto",
    tagColor: "bg-purple-400/10 text-purple-400",
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
  { icon: "🔒", title: "End-to-End Encrypted", desc: "Your data never leaves our secure servers" },
  { icon: "📍", title: "16,000+ Locations", desc: "InPost terminals across the UK, 24/7" },
  { icon: "⚡", title: "Same-Day Dispatch", desc: "Order before 14:00, ships same afternoon" },
  { icon: "🎯", title: "No ID Required", desc: "Anonymous pickup — postcode & email only" },
  { icon: "🔕", title: "Zero-Smell Packaging", desc: "Vacuum-sealed, no branding, fully discreet" },
  { icon: "💬", title: "24/7 AI Support", desc: "Get instant help any time of day" },
];

/* ── Page ── */

export default function HowItWorksPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/10 px-5 py-8 text-center sm:rounded-3xl sm:py-14">
        {/* Sci-fi bg layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a12] via-[#0d0d0d] to-[#0d0d0d]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(16,185,129,0.5), transparent 55%)" }} aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />
        <div className="absolute -top-12 right-1/4 h-32 w-32 rounded-full bg-emerald-400/8 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute -bottom-8 left-1/4 h-24 w-24 rounded-full bg-cyan-400/8 blur-2xl" aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-emerald-400">Simple · Secure · Anonymous</span>
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-4xl">
            How It{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-white/40">
            From browsing to anonymous pickup — 6 simple steps.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-5 flex flex-wrap justify-center gap-3">
            {[
              { val: "16,000+", label: "Pickup Points", icon: "📍" },
              { val: "Same Day", label: "Dispatch", icon: "⚡" },
              { val: "72h", label: "Collection Window", icon: "⏱️" },
              { val: "No ID", label: "Required", icon: "🔒" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-sm">{s.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{s.val}</p>
                  <p className="text-[8px] uppercase tracking-wider text-white/30">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="space-y-3">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white sm:text-lg">Your Order Journey</h2>
          <p className="text-[10px] text-white/30 mt-0.5">6 steps from browsing to pickup</p>
        </div>

        {steps.map((step, i) => (
          <div key={step.num} className="relative">
            <div className={`relative overflow-hidden rounded-2xl border ${step.border} bg-gradient-to-r ${step.gradient} p-4 sm:p-5`}>
              {/* Corner glow */}
              <div className={`absolute -top-6 -right-6 h-20 w-20 ${step.glow} rounded-full blur-2xl`} aria-hidden="true" />

              <div className="relative z-10 flex items-start gap-3.5">
                {/* Number + Icon */}
                <div className="flex flex-col items-center">
                  <span className={`text-2xl font-black font-mono ${step.numColor}`}>{step.num}</span>
                  <span className="mt-0.5 text-xl">{step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">{step.desc}</p>
                </div>
              </div>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <div className={`h-3 w-px ${step.glow}`} />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Payment Methods ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-white/8 p-5 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d1a] to-[#0d0d0d]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />

        <div className="relative z-10">
          <h2 className="text-base font-bold text-white sm:text-lg">Payment Methods</h2>
          <p className="text-[10px] text-white/30 mt-0.5">Multiple secure payment options</p>

          <div className="mt-4 space-y-2.5">
            {paymentMethods.map((m) => (
              <div key={m.name} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 flex items-start gap-3">
                <span className="text-2xl mt-0.5">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{m.name}</h3>
                    <span className={`rounded-full ${m.tagColor} px-2 py-0.5 text-[9px] font-semibold`}>
                      {m.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/40">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-3 sm:text-lg">
          Why{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Green Hub 420
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {trustPoints.map((t) => (
            <div key={t.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-lg">{t.icon}</span>
              <h3 className="mt-1.5 text-[11px] font-bold text-white">{t.title}</h3>
              <p className="mt-0.5 text-[9px] leading-relaxed text-white/30">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-white/8 p-5 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] to-[#0a0d1a]" aria-hidden="true" />
        <div className="relative z-10">
          <h2 className="text-base font-bold text-white sm:text-lg">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/8 bg-white/[0.02]">
                <summary className="flex cursor-pointer items-center justify-between px-3.5 py-3 text-xs font-medium text-white">
                  {f.q}
                  <span className="ml-2 text-white/30 transition group-open:rotate-45 text-sm">+</span>
                </summary>
                <div className="px-3.5 pb-3 text-xs leading-relaxed text-white/45">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Earn CTA ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-purple-400/15 p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/5" aria-hidden="true" />
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-purple-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 flex items-start gap-3.5">
          <span className="text-2xl mt-0.5">💰</span>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">Earn 15–25% Commission</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Share your invite link. Every time a friend orders, you earn commission — credited to your wallet instantly.
            </p>
            <Link
              href="/account/commission"
              className="mt-3 inline-flex min-h-[36px] items-center justify-center rounded-full bg-purple-500 px-5 text-xs font-semibold text-white transition hover:bg-purple-400"
            >
              Open Earn Hub →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 px-5 py-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />

        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Ready to order?</h2>
          <p className="mt-1 text-xs text-white/40">Browse our collection and get started in minutes.</p>
          <div className="mt-4 flex gap-2.5 justify-center">
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-7 text-sm font-semibold uppercase tracking-wider text-black shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition"
            >
              Shop Now
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-white/70 active:scale-[0.97] transition"
            >
              <span>💬</span> Get Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
