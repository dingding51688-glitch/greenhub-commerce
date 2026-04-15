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
        <div className="space-y-4 text-center">
          <p className="text-5xl">🛒</p>
          <p className="text-lg font-bold text-white">Your cart is empty</p>
          <p className="text-xs text-white/40">Browse our products and add something you like</p>
          <Link href="/products" className="inline-flex min-h-[48px] items-center rounded-xl cta-gradient px-6 text-sm font-bold text-white">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Cart</h1>
          <p className="mt-0.5 text-xs text-white/40">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
        </div>
        <button onClick={clearCart} className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-[10px] font-medium text-red-300 active:bg-red-400/10">
          Clear all
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
        {/* Items */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={`${item.productId}::${item.weight}`}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-3"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <Link href={`/products/${item.slug}`} className="shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} width={72} height={72} className="rounded-xl object-cover bg-white/5" />
                  ) : (
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-white/5 text-2xl">📦</div>
                  )}
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/products/${item.slug}`} className="text-[13px] font-bold text-white hover:text-emerald-300 transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="shrink-0 text-[15px] font-bold text-white">{GBP.format(item.unitPrice * item.quantity)}</p>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.weight} · {GBP.format(item.unitPrice)} each</p>
                </div>
              </div>

              {/* Qty controls + remove */}
              <div className="flex items-center justify-between mt-2.5 pl-[84px]">
                <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <button
                    onClick={() => updateQty(item.productId, item.weight, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center text-sm text-white/50 hover:text-white active:bg-white/5 rounded-l-xl disabled:opacity-20 transition"
                  >−</button>
                  <span className="min-w-[32px] text-center text-sm font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.weight, item.quantity + 1)}
                    disabled={item.quantity >= 10}
                    className="flex h-9 w-9 items-center justify-center text-sm text-white/50 hover:text-white active:bg-white/5 rounded-r-xl disabled:opacity-20 transition"
                  >+</button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.weight)}
                  className="rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-red-300/50 hover:text-red-300 hover:bg-red-400/5 active:bg-red-400/10 transition"
                >
                  🗑 Remove
                </button>
              </div>
            </div>
          ))}

          <Link href="/products" className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 mt-1">
            ← Continue shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Order Summary</p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{GBP.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">📦 Delivery</span>
                <span className="text-white">{GBP.format(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between border-t border-white/8 pt-2.5">
                <span className="font-bold text-white">Total</span>
                <span className="text-lg font-bold text-emerald-300">{GBP.format(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(token ? "/checkout" : "/login")}
              className="mt-4 flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white gap-2 active:opacity-90 transition"
            >
              {token ? (
                <>Checkout · {GBP.format(grandTotal)}</>
              ) : (
                "Log in to Checkout"
              )}
            </button>
          </div>

          {/* Shipping info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-white mb-2">🚚 Delivery Info</p>
            <div className="space-y-1.5 text-[10px] text-white/40">
              <p>📦 Vacuum-sealed, discreet packaging</p>
              <p>⚡ Same-evening dispatch (before 8pm)</p>
              <p>📍 InPost locker across Northern Ireland</p>
              <p>📱 Collection code via SMS within 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0b0e]/95 backdrop-blur-xl px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">Total ({totalItems} items)</span>
          <span className="text-lg font-bold text-emerald-300">{GBP.format(grandTotal)}</span>
        </div>
        <button
          onClick={() => router.push(token ? "/checkout" : "/login")}
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white active:opacity-90"
        >
          {token ? `Checkout · ${GBP.format(grandTotal)}` : "Log in to Checkout"}
        </button>
      </div>
    </div>
  );
}
