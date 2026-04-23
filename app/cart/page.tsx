"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { DELIVERY_FEE } from "@/lib/delivery-api";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function CartPage() {
  const { items, totalItems, subtotal, removeItem, updateQty, clearCart } = useCart();
  const { token } = useAuth();
  const router = useRouter();
  const grandTotal = subtotal + DELIVERY_FEE;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="relative isolate w-full max-w-sm mx-auto text-center px-6">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-32 w-32 rounded-full bg-emerald-400/6 blur-3xl" />
            <div className="absolute left-1/3 top-1/2 h-20 w-20 rounded-full bg-cyan-400/5 blur-2xl" />
          </div>

          {/* Animated cart icon */}
          <div className="relative inline-flex mb-5">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-emerald-400/60">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 6h18" stroke="currentColor" strokeWidth="1.2" />
                <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <h2 className="text-base font-bold text-white">Your cart is empty</h2>
          <p className="mt-1.5 text-xs text-white/30 leading-relaxed">Browse our collection and find something you&apos;ll love</p>

          <Link href="/products"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16l-1.5 9a2 2 0 01-2 1.5H7.5a2 2 0 01-2-1.5L4 7z" />
              <path d="M4 7l1-3h14l1 3" />
            </svg>
            Browse Products
          </Link>

          {/* Trust badges */}
          <div className="mt-8 flex justify-center gap-3">
            {[
              { icon: "⚡", text: "Same Day" },
              { icon: "🔒", text: "Discreet" },
              { icon: "📦", text: "Tracked" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-1 rounded-lg border border-white/6 bg-white/[0.02] px-2 py-1">
                <span className="text-[10px]">{b.icon}</span>
                <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wider">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-36">
      {/* Header — sci-fi */}
      <div className="relative isolate overflow-hidden rounded-xl border border-white/6 bg-white/[0.01] mb-3 px-4 py-3">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} aria-hidden="true" />
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-emerald-400/8 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">Cart</h1>
            <p className="text-[10px] text-white/30">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
          </div>
          <button onClick={() => { if (window.confirm("Clear all items from cart?")) clearCart(); }} className="rounded-lg border border-red-400/15 bg-red-400/[0.04] px-2.5 py-1 text-[9px] font-medium text-red-300/60 active:bg-red-400/10 transition">
            Clear all
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr,320px]">
        {/* Items — compact list */}
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={`${item.productId}::${item.weight}`}
              className="relative isolate overflow-hidden flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.01] px-2.5 py-2"
            >
              <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-emerald-400/5 blur-xl" aria-hidden="true" />
              {/* Thumb — small */}
              <Link href={`/products/${item.slug}`} className="shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={48} height={48} className="rounded-lg object-cover bg-white/5" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-lg">📦</div>
                )}
              </Link>

              {/* Middle: name + weight + qty */}
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="block truncate text-xs font-semibold text-white hover:text-emerald-300">
                  {item.title}
                </Link>
                <p className="text-[9px] text-white/25 mt-0.5">{item.weight} · {GBP.format(item.unitPrice)} ea</p>

                {/* Qty inline */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center rounded-lg border border-white/8 bg-white/[0.03]">
                    <button
                      onClick={() => updateQty(item.productId, item.weight, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-6 w-6 items-center justify-center text-[11px] text-white/40 active:bg-white/5 rounded-l-lg disabled:opacity-20"
                    >−</button>
                    <span className="min-w-[20px] text-center text-[11px] font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.weight, item.quantity + 1)}
                      disabled={item.quantity >= 10}
                      className="flex h-6 w-6 items-center justify-center text-[11px] text-white/40 active:bg-white/5 rounded-r-lg disabled:opacity-20"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.weight)}
                    className="text-[8px] text-red-300/40 hover:text-red-300"
                  >✕</button>
                </div>
              </div>

              {/* Price — right */}
              <p className="shrink-0 text-sm font-bold text-white">{GBP.format(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Summary — desktop sidebar */}
        <div className="hidden lg:block space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{GBP.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">📦 Delivery</span>
                <span className="text-white">{GBP.format(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between border-t border-white/8 pt-2">
                <span className="font-bold text-white">Total</span>
                <span className="text-lg font-bold text-emerald-300">{GBP.format(grandTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(token ? "/checkout" : "/login")}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white"
            >
              {token ? `Checkout · ${GBP.format(grandTotal)}` : "Log in to Checkout"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-white mb-2">🚚 Delivery Info</p>
            <div className="space-y-1 text-[10px] text-white/40">
              <p>📦 Vacuum-sealed, discreet packaging</p>
              <p>⚡ Same-evening dispatch (before 8pm)</p>
              <p>📍 InPost locker across Northern Ireland</p>
              <p>📱 Collection code via SMS within 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: summary + continue shopping + sticky checkout */}
      <div className="lg:hidden mt-3 space-y-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white/70">{GBP.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px] mt-1">
            <span className="text-white/40">📦 Delivery</span>
            <span className="text-white/70">{GBP.format(DELIVERY_FEE)}</span>
          </div>
        </div>

        <Link href="/products" className="inline-flex items-center text-[10px] text-white/25 hover:text-white/40">
          ← Continue shopping
        </Link>
      </div>

      {/* Mobile sticky checkout — sci-fi */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-emerald-400/10 bg-[#060606]/95 backdrop-blur-xl px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[9px] text-white/40">{totalItems} items</p>
            <p className="text-[15px] font-bold text-emerald-300">{GBP.format(grandTotal)}</p>
          </div>
          <button
            onClick={() => router.push(token ? "/checkout" : "/login")}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition"
          >
            {token ? "Checkout" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
