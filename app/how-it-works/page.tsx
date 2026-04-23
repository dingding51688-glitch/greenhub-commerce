import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Green Hub 420",
  description: "Order premium cannabis online and pick up anonymously from 16,000+ InPost lockers across the UK. No name, no ID required.",
};

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Browse & Choose",
    desc: "Explore our curated collection of premium strains, edibles, and concentrates. Filter by type, potency, or price. Every product has detailed descriptions, THC levels, and customer reviews.",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/0",
    border: "border-emerald-400/20",
    glow: "bg-emerald-400/10",
    numColor: "text-emerald-400/60",
  },
  {
    num: "02",
    icon: "💳",
    title: "Secure Payment",
    desc: "Pay with wallet balance (instant), bank transfer (5 min), or USDT crypto. All transactions are encrypted. Top up your wallet anytime for faster checkout.",
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/0",
    border: "border-cyan-400/20",
    glow: "bg-cyan-400/10",
    numColor: "text-cyan-400/60",
  },
  {
    num: "03",
    icon: "📦",
    title: "We Dispatch",
    desc: "Your order is vacuum-sealed and dispatched same day. Fully discreet packaging — no branding, no smell. Tracked via Yodel or Royal Mail to your chosen pickup point.",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/0",
    border: "border-blue-400/20",
    glow: "bg-blue-400/10",
    numColor: "text-blue-400/60",
  },
  {
    num: "04",
    icon: "🔓",
    title: "Anonymous Pickup",
    desc: "Collect from any of 16,000+ InPost lockers or OOHPod points. Enter your code, open the door, grab your parcel. No ID check, no signature. Done in 30 seconds.",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/0",
    border: "border-purple-400/20",
    glow: "bg-purple-400/10",
    numColor: "text-purple-400/60",
  },
];

const features = [
  { icon: "🔒", title: "End-to-End Encrypted", desc: "Your data never leaves our secure servers" },
  { icon: "👤", title: "No ID Required", desc: "We don't ask for real names or documents" },
  { icon: "📍", title: "16,000+ Locations", desc: "InPost lockers in every major UK city" },
  { icon: "⚡", title: "Same Day Dispatch", desc: "Order before 2PM for same-day shipping" },
  { icon: "🔕", title: "Zero-Smell Packaging", desc: "Vacuum-sealed, no branding, fully discreet" },
  { icon: "💬", title: "24/7 AI Support", desc: "Get help instantly, any time of day" },
];

export default function HowItWorksPage() {
  return (
    <div className="pb-20 space-y-8">
      {/* ── Header ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/10 px-5 py-8 text-center sm:rounded-3xl sm:py-14">
        {/* Sci-fi bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a12] via-[#0d0d0d] to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.4), transparent 60%)" }} aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1">
            <span className="text-[10px] font-medium text-emerald-400">Simple · Secure · Anonymous</span>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-4xl">
            How It{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
          </h1>
          <p className="mt-2 text-sm text-white/40 max-w-md mx-auto">
            Four simple steps from browsing to pickup. No accounts, no ID, no hassle.
          </p>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`relative overflow-hidden rounded-2xl border ${step.border} bg-gradient-to-r ${step.gradient} p-5 sm:p-6`}
          >
            {/* Glow */}
            <div className={`absolute -top-8 -right-8 h-24 w-24 ${step.glow} rounded-full blur-3xl`} aria-hidden="true" />

            <div className="relative z-10">
              <div className="flex items-start gap-4">
                {/* Number badge */}
                <div className="flex flex-col items-center">
                  <span className={`text-3xl font-black ${step.numColor} font-mono`}>{step.num}</span>
                  <span className="mt-1 text-2xl">{step.icon}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white sm:text-lg">{step.title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/45 sm:text-sm">{step.desc}</p>
                </div>
              </div>
            </div>

            {/* Connector line (hidden on last) */}
            {step.num !== "04" && (
              <div className="absolute bottom-0 left-[26px] w-px h-4 bg-gradient-to-b from-white/10 to-transparent translate-y-full z-20" />
            )}
          </div>
        ))}
      </section>

      {/* ── Why Choose Us ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4 sm:text-lg">
          Why <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Green Hub 420</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 sm:p-4">
              <span className="text-xl">{f.icon}</span>
              <h3 className="mt-2 text-xs font-bold text-white">{f.title}</h3>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/35">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment Methods ── */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-bold text-white mb-3">Accepted Payment Methods</h2>
        <div className="flex gap-3">
          {[
            { icon: "🏦", name: "Bank Transfer", desc: "UK bank transfer, funds clear in ~5 min", tag: "5 min" },
            { icon: "💳", name: "Wallet", desc: "Pre-loaded balance for instant checkout", tag: "Instant" },
            { icon: "₮", name: "USDT", desc: "Tether (TRC-20 / ERC-20)", tag: "Crypto" },
          ].map((m) => (
            <div key={m.name} className="flex-1 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <span className="text-xl">{m.icon}</span>
              <p className="mt-1 text-[10px] font-semibold text-white/70">{m.name}</p>
              <p className="text-[9px] text-emerald-400/70">{m.tag}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 px-5 py-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />

        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Ready to order?</h2>
          <p className="mt-1 text-xs text-white/40">Browse our collection and get started in minutes.</p>
          <div className="mt-4 flex gap-2.5 justify-center">
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 text-sm font-semibold uppercase tracking-wider text-black shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition"
            >
              Shop Now
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold text-white/70 active:scale-[0.97] transition"
            >
              <span>💬</span> Get Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
