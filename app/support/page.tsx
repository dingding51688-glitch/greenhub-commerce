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

      {/* Main CTA — Support Bot */}
      <a href="https://t.me/greenhub247_bot" target="_blank" rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-transparent p-5 active:scale-[0.98] transition-all">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl group-hover:bg-emerald-400/20 transition-colors" />
        <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-emerald-500/5 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white">Chat with Support Bot</p>
            <p className="text-xs text-emerald-300/60 mt-0.5">AI answers instantly · Human agent on standby</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-lg group-hover:bg-emerald-400 transition-colors">
            →
          </div>
        </div>
      </a>

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
          <p className="text-[10px] text-blue-300/50">New drops, exclusive deals & announcements</p>
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
