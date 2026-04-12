"use client";

import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import type { ProductRecord, WeightOption } from "@/lib/types";

const MIN_QTY = 1;
const MAX_QTY = 5;

const FALLBACK: WeightOption[] = [
  { id: 1001, label: "3.5g", price: 35, unitPrice: "£10/g" },
  { id: 1002, label: "7g", price: 60, unitPrice: "£8.57/g" },
  { id: 1003, label: "14g", price: 110, unitPrice: "£7.85/g" },
  { id: 1004, label: "28g", price: 180, unitPrice: "£6.42/g", featured: true },
];

function getUnitPrice(o: WeightOption) {
  if (o.unitPrice) return o.unitPrice;
  const m = o.label.match(/([\d.]+)\s*g/i);
  if (m) { const g = parseFloat(m[1]); if (g > 0) return `£${(o.price / g).toFixed(2)}/g`; }
  return "";
}

function savePct(options: WeightOption[], current: WeightOption): number | null {
  const base = options[0];
  if (!base || base.id === current.id) return null;
  const baseM = base.label.match(/([\d.]+)/);
  const curM = current.label.match(/([\d.]+)/);
  if (!baseM || !curM) return null;
  const basePerG = base.price / parseFloat(baseM[1]);
  const curPerG = current.price / parseFloat(curM[1]);
  const pct = Math.round(((basePerG - curPerG) / basePerG) * 100);
  return pct > 0 ? pct : null;
}

export function ProductDetailPurchase({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const { addItem } = useCart();
  const outOfStock = product.inStock === false;
  const options = (product.weightOptions?.length ? product.weightOptions : FALLBACK).slice(0, 4);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  const handleAdd = () => {
    if (!selected) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.coverImage?.url ?? null,
      weight: selected.label,
      unitPrice: selected.price,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => router.push("/cart"), 600);
  };

  if (outOfStock) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase text-red-300">Out of Stock</span>
        </div>
        <p className="text-sm text-white/50">This product is currently unavailable. Check back soon!</p>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] text-white/25 space-y-0.5">
          <p>🚚 UK-wide delivery via InPost lockers</p>
          <p>📦 Vacuum-sealed, discreet packaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Price Banner ── */}
      <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400/70">Starting from</p>
            <p className="mt-0.5 text-4xl font-extrabold text-white">
              £{options[0]?.price.toFixed(0)}
            </p>
            <p className="text-xs text-white/40">{options[0]?.label} · {getUnitPrice(options[0])}</p>
          </div>
          {options.length > 1 && (
            <div className="text-right">
              <p className="text-[10px] text-white/30">Best value</p>
              <p className="text-lg font-bold text-emerald-400">
                £{options[options.length - 1]?.price.toFixed(0)}
              </p>
              <p className="text-[10px] text-emerald-400/60">
                {options[options.length - 1]?.label} · {getUnitPrice(options[options.length - 1])}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Weight Selector ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/50">Choose Weight</p>

        <div className="space-y-2">
          {options.map((o) => {
            const active = selected?.id === o.id;
            const soldOut = o.stock === 0;
            const popular = o.featured || o.label.toLowerCase().includes("28");
            const save = savePct(options, o);

            return (
              <button
                key={o.id}
                onClick={() => !soldOut && setSelectedId(o.id)}
                disabled={soldOut}
                className={clsx(
                  "relative flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition",
                  soldOut
                    ? "border-white/5 bg-white/[0.03] opacity-40 cursor-not-allowed"
                    : active
                      ? "border-emerald-400/50 bg-emerald-400/15 shadow-[0_0_20px_rgba(52,211,153,0.12)]"
                      : "border-white/12 bg-white/[0.06] hover:border-white/25 hover:bg-white/[0.08]"
                )}
              >
                {/* Left: weight + badges */}
                <div className="flex items-center gap-3">
                  {/* Radio dot */}
                  <div className={clsx(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition",
                    active ? "border-emerald-400" : "border-white/20"
                  )}>
                    {active && <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-lg font-extrabold",
                        soldOut ? "text-white/30 line-through" : "text-white"
                      )}>
                        {o.label}
                      </span>
                      {popular && !soldOut && (
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                          🔥 Popular
                        </span>
                      )}
                      {save && !soldOut && (
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                          Save {save}%
                        </span>
                      )}
                      {soldOut && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-red-300">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50">{getUnitPrice(o)}</p>
                  </div>
                </div>

                {/* Right: price */}
                <span className={clsx(
                  "text-2xl font-extrabold tabular-nums",
                  soldOut ? "text-white/30 line-through" : active ? "text-emerald-400" : "text-white"
                )}>
                  £{o.price.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quantity + Total + Add to Cart ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        {/* Quantity row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(MIN_QTY, q - 1))}
              disabled={qty === MIN_QTY}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg font-bold text-white transition hover:bg-white/5 disabled:opacity-20"
            >−</button>
            <span className="w-8 text-center text-xl font-bold text-white tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              disabled={qty === MAX_QTY}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg font-bold text-white transition hover:bg-white/5 disabled:opacity-20"
            >+</button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Total</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">
              £{((selected?.price ?? 0) * qty).toFixed(0)}
            </p>
            {qty > 1 && selected && (
              <p className="text-[10px] text-white/25">{qty} × £{selected.price.toFixed(0)}</p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!selected || added}
            className={clsx(
              "flex min-h-[52px] min-w-[160px] items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wider transition",
              added
                ? "bg-emerald-400/20 text-emerald-300"
                : "cta-gradient text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.97]"
            )}
          >
            {added ? "✓ Added" : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shipping info */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[11px] text-white/30 space-y-1">
        <p>🚚 Ships across the UK including Northern Ireland</p>
        <p>📦 Vacuum-sealed, discreet packaging</p>
        <p>💷 £5 delivery fee per order</p>
      </div>
    </div>
  );
}
