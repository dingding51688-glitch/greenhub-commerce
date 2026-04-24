"use client";

import { useState } from "react";

const FAQ = [
  { q: "How does delivery work?", a: "We ship to InPost lockers across the UK. Enter your postcode at checkout — we'll assign the nearest locker. Once ready, you get an email with the access code. Lockers are 24/7, collect within 72 hours." },
  { q: "How do I pay?", a: "Top up your wallet with USDT (crypto) or bank transfer via our Telegram bot. Balances show in GBP. Wallet-to-wallet transfers are instant and free." },
  { q: "How do I track my order?", a: "Go to Account → Orders and tap your order number. You'll see live status + tracking ID. We also email you on every status change." },
  { q: "How long does delivery take?", a: "3–5 business days after dispatch. Orders placed before 8pm ship same evening. You'll get a tracking number within 24 hours." },
  { q: "What areas do you cover?", a: "UK-wide. Mainland GB via InPost lockers (16,000+ locations). Northern Ireland via OOHPod lockers and Yodel collection points." },
  { q: "What's the return policy?", a: "Due to the nature of our products, we do not accept returns. If there's an issue with your order, contact support and we'll resolve it." },
  { q: "How do withdrawals work?", a: "Minimum £100, 3% fee. Go to Wallet → Withdraw. UK bank transfer or USDT. Processed within 24 hours." },
  { q: "Is my package discreet?", a: "Yes. All orders are vacuum-sealed in plain, unmarked packaging. No branding, no product descriptions. Looks like any other online order." },
  { q: "How do I join the daily £100 lottery?", a: "1) Join our @greenhub420 Telegram channel. 2) Message @gh420lottery_bot and send /bind GH-XXXXXXXX (your wallet ID). 3) Go back to the channel and tap the pinned JOIN button. Draw is at 8PM UK time daily. First-time bind gets £5 bonus free!" },
  { q: "What is the Competition?", a: "100 tickets at £2 each. Pick your lucky numbers or get random ones. Max 5 tickets per person. When all tickets sell out (or 24h passes), one number is drawn — if it was sold, the owner wins £200 (real balance, withdrawable!)." },
  { q: "How do I bind my Telegram for the lottery?", a: "Open Telegram, message @gh420lottery_bot, and send: /bind GH-XXXXXXXX (replace with your wallet ID from the Wallet page). You'll get £5 bonus on first bind. Then go to @greenhub420 channel and click JOIN." },
  { q: "What's the referral/earn programme?", a: "Share your unique referral link (Account → Earn Hub). Friends who register and shop earn you 15-25% commission on every order, forever. Commission goes straight to your wallet." },
];

const SUPPORT_FEATURES = [
  { icon: "🤖", title: "AI-Powered", desc: "Get instant answers to any question, 24 hours a day" },
  { icon: "📦", title: "Order Tracking", desc: "Share your order reference and get live status updates" },
  { icon: "🌐", title: "Multilingual", desc: "Type in any language — we'll reply in yours" },
  { icon: "👤", title: "Human Backup", desc: "Complex issues are handed to a real agent seamlessly" },
];

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 sm:pb-20">
      {/* Hero Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-emerald-400">Online 24/7</span>
        </div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">How can we help?</h1>
        <p className="mt-2 text-sm text-white/40 max-w-sm mx-auto">Our AI support bot handles most questions instantly. For complex issues, a human agent takes over.</p>
      </div>

      {/* Main CTA — Support Bot (sci-fi style) */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-cyan-400/20 px-5 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-purple-600/10" aria-hidden="true" />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-lg">🤖</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0a]" />
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Support Agent</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Online — responds in seconds</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              { icon: "⚡", text: "Instant replies" },
              { icon: "🌐", text: "24/7 available" },
              { icon: "🔒", text: "Private & secure" },
              { icon: "💬", text: "Any language" },
            ].map((f) => (
              <span key={f.text} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/50">
                <span>{f.icon}</span> {f.text}
              </span>
            ))}
          </div>

          <a href="https://t.me/greenhub247_bot" target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 active:scale-[0.97] transition">
            <span>💬</span> Chat with AI
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {SUPPORT_FEATURES.map((f, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <span className="text-xl">{f.icon}</span>
            <p className="text-xs font-semibold text-white mt-2">{f.title}</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Telegram Channel */}
      <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/5 px-4 py-3.5 active:scale-[0.98] transition">
        <span className="text-2xl">✈️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Join our Telegram Channel</p>
          <p className="text-[10px] text-blue-300/50">Daily £100 lottery · Updates · Deals</p>
        </div>
        <span className="rounded-full bg-blue-400/15 px-3 py-1 text-[10px] font-bold text-blue-300">Join</span>
      </a>

      {/* FAQ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="w-full rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{item.q}</p>
                <span className={`text-white/25 text-xs transition-transform flex-shrink-0 ${expandedFaq === i ? "rotate-180" : ""}`}>▼</span>
              </div>
              {expandedFaq === i && (
                <p className="mt-3 text-xs text-white/45 leading-relaxed border-t border-white/5 pt-3">{item.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-4">
        <p className="text-xs text-white/30 mb-3">Still have questions?</p>
        <a href="https://t.me/greenhub247_bot" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-5 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors">
          💬 Open Support Chat
        </a>
      </div>
    </div>
  );
}
