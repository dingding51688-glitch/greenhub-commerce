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
    <div className="pb-36">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-white">Cart</h1>
          <p className="text-[10px] text-white/40">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
        </div>
        <button onClick={() => { if (window.confirm("Clear all items from cart?")) clearCart(); }} className="rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1 text-[9px] font-medium text-red-300 active:bg-red-400/10">
          Clear all
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr,320px]">
        {/* Items — compact list */}
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={`${item.productId}::${item.weight}`}
              className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-2.5 py-2"
            >
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

      {/* Mobile sticky checkout */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0b0e]/95 backdrop-blur-xl px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[9px] text-white/40">{totalItems} items</p>
            <p className="text-[15px] font-bold text-emerald-300">{GBP.format(grandTotal)}</p>
          </div>
          <button
            onClick={() => router.push(token ? "/checkout" : "/login")}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white active:opacity-90"
          >
            {token ? "Checkout" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
