"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function CartPage() {
  const { items, totalItems, subtotal, removeItem, updateQty, clearCart } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <section className="mx-auto mt-16 max-w-md space-y-6 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="text-2xl font-semibold text-white">Your cart is empty</h1>
        <p className="text-sm text-white/50">Browse the menu and add something you like.</p>
        <Button onClick={() => router.push("/products")}>Browse products</Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Shopping cart</p>
          <h1 className="text-2xl font-semibold text-white">{totalItems} {totalItems === 1 ? "item" : "items"}</h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-red-300 hover:text-red-200 transition"
        >
          Clear cart
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* ── Cart items ── */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}::${item.weight}`}
              className="flex gap-4 rounded-3xl border border-white/10 bg-night-950/70 p-4"
            >
              {/* Thumbnail */}
              <Link href={`/products/${item.slug}`} className="shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                    📦
                  </div>
                )}
              </Link>

              {/* Details */}
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-white hover:underline truncate block">
                    {item.title}
                  </Link>
                  <p className="text-xs text-white/50">{item.weight}</p>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 rounded-full border border-white/15 px-2 py-1">
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30"
                      onClick={() => updateQty(item.productId, item.weight, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30"
                      onClick={() => updateQty(item.productId, item.weight, item.quantity + 1)}
                      disabled={item.quantity >= 10}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.weight)}
                    className="text-xs text-red-400/70 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">{currency.format(item.unitPrice * item.quantity)}</p>
                {item.quantity > 1 && (
                  <p className="text-[11px] text-white/40">{currency.format(item.unitPrice)} each</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Summary ── */}
        <aside className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">Order summary</h3>

            <div className="flex justify-between text-sm text-white/70">
              <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
              <span className="font-semibold text-white">{currency.format(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-white/70">
              <span>Shipping</span>
              <span className="text-emerald-300">Free</span>
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-between text-base font-semibold text-white">
              <span>Total</span>
              <span>{currency.format(subtotal)}</span>
            </div>

            {token ? (
              <Button
                className="w-full"
                onClick={() => router.push("/checkout")}
              >
                Proceed to checkout
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Log in to checkout
              </Button>
            )}

            <p className="text-center text-[11px] text-white/40">
              Payment via Wallet balance or crypto (USDT)
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/60">
            <p className="font-semibold text-white/80">Shipping info</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>📦 Vacuum-sealed, discreet packaging</li>
              <li>🚚 Same-day dispatch (orders before 2pm)</li>
              <li>📍 UK mainland (England, Scotland, Wales)</li>
              <li>🔒 Tracking number within 24h</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="text-center pt-2">
        <Link href="/products" className="text-xs text-white/40 hover:text-white/60">
          ← Continue shopping
        </Link>
      </div>
    </section>
  );
}
