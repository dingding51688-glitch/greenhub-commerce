"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function CartPage() {
  const { items, totalItems, subtotal, removeItem, updateQty, clearCart } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-4xl">🛒</p>
          <p className="text-lg font-bold text-white">Your cart is empty</p>
          <p className="text-xs text-white/40">Browse products and add something you like</p>
          <Link href="/products" className="inline-flex min-h-[44px] items-center rounded-xl cta-gradient px-6 text-sm font-bold text-white">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Cart</h1>
          <p className="mt-0.5 text-xs text-white/40">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
        </div>
        <button onClick={clearCart} className="text-[10px] text-red-300/60 hover:text-red-300">Clear all</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        {/* Items */}
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={`${item.productId}::${item.weight}`}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
            >
              {/* Thumbnail */}
              <Link href={`/products/${item.slug}`} className="shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={56} height={56} className="rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-xl">📦</div>
                )}
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="block truncate text-sm font-semibold text-white hover:underline">
                  {item.title}
                </Link>
                <p className="text-[10px] text-white/30">{item.weight} · {GBP.format(item.unitPrice)} each</p>

                {/* Qty + remove */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-white/10">
                    <button
                      onClick={() => updateQty(item.productId, item.weight, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center text-xs text-white/50 hover:text-white disabled:opacity-20"
                    >−</button>
                    <span className="min-w-[24px] text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.weight, item.quantity + 1)}
                      disabled={item.quantity >= 10}
                      className="flex h-7 w-7 items-center justify-center text-xs text-white/50 hover:text-white disabled:opacity-20"
                    >+</button>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.weight)} className="text-[9px] text-red-300/50 hover:text-red-300">
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <p className="shrink-0 text-sm font-bold text-white">{GBP.format(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Order Summary</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{GBP.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Delivery</span>
                <span className="text-emerald-300 text-xs">Free</span>
              </div>
              <div className="flex justify-between border-t border-white/8 pt-2">
                <span className="font-bold text-white">Total</span>
                <span className="text-lg font-bold text-white">{GBP.format(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(token ? "/checkout" : "/login")}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white"
            >
              {token ? "Checkout" : "Log in to Checkout"}
            </button>

            <p className="mt-2 text-center text-[8px] text-white/15">Wallet balance · Free delivery</p>
          </div>

          {/* Shipping info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-white mb-2">📦 Delivery</p>
            <div className="space-y-1 text-[10px] text-white/40">
              <p>• Vacuum-sealed, discreet packaging</p>
              <p>• Same-evening dispatch (before 8pm)</p>
              <p>• InPost locker across Northern Ireland</p>
              <p>• Collection code via SMS within 24h</p>
            </div>
          </div>

          <Link href="/products" className="block text-center text-[10px] text-white/25 hover:text-white/40">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
