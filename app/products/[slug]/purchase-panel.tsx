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
  const firstInStock = options.find((o) => o.stock !== 0);
  const [selectedId, setSelectedId] = useState(firstInStock?.id ?? options[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const selectedSoldOut = selected?.stock === 0;

  const handleAdd = () => {
    if (!selected || selectedSoldOut) return;
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
      <div className="space-y-3 rounded-2xl border border-red-500/30 bg-[#1C1C1E] p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase text-red-400">Out of Stock</span>
        </div>
        <p className="text-sm text-neutral-400">This product is currently unavailable. Check back soon!</p>
        <div className="rounded-xl bg-[#151517] px-4 py-3 text-xs text-neutral-500 space-y-1">
          <p>🚚 UK-wide delivery via InPost lockers</p>
          <p>📦 Vacuum-sealed, discreet packaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Weight Selector ── */}
      <div className="rounded-2xl bg-[#1C1C1E] p-5 space-y-4">
        <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Choose Weight</p>

        <div className="space-y-2.5">
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
                  "relative flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all",
                  soldOut
                    ? "border-neutral-700 bg-[#252528] opacity-40 cursor-not-allowed"
                    : active
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-transparent bg-[#252528] hover:border-neutral-600 hover:bg-[#2A2A2D]"
                )}
              >
                {/* Left side */}
                <div className="flex items-center gap-4">
                  {/* Radio */}
                  <div className={clsx(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition",
                    active ? "border-emerald-400 bg-emerald-400/10" : "border-neutral-500"
                  )}>
                    {active && <div className="h-3 w-3 rounded-full bg-emerald-400" />}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xl font-extrabold tracking-tight",
                        soldOut ? "text-neutral-500 line-through" : "text-white"
                      )}>
                        {o.label}
                      </span>
                      {popular && !soldOut && (
                        <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                          🔥 Popular
                        </span>
                      )}
                      {save && !soldOut && (
                        <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300">
                          Save {save}%
                        </span>
                      )}
                      {soldOut && (
                        <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-400">{getUnitPrice(o)}</p>
                  </div>
                </div>

                {/* Right: price */}
                <span className={clsx(
                  "text-2xl font-extrabold tabular-nums",
                  soldOut ? "text-neutral-600 line-through" : active ? "text-emerald-400" : "text-white"
                )}>
                  £{o.price.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quantity + Total + Add to Cart ── */}
      <div className="rounded-2xl bg-[#1C1C1E] p-5 space-y-4">
        {/* Quantity */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Quantity</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty((q) => Math.max(MIN_QTY, q - 1))}
              disabled={qty === MIN_QTY}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#252528] text-lg font-bold text-white transition hover:bg-[#303033] disabled:opacity-20"
            >−</button>
            <span className="w-8 text-center text-2xl font-extrabold text-white tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              disabled={qty === MAX_QTY}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#252528] text-lg font-bold text-white transition hover:bg-[#303033] disabled:opacity-20"
            >+</button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-700/50" />

        {/* Total + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Total</p>
            <p className="text-4xl font-extrabold text-emerald-400 tabular-nums">
              £{((selected?.price ?? 0) * qty).toFixed(0)}
            </p>
            {qty > 1 && selected && (
              <p className="mt-0.5 text-sm text-neutral-500">{qty} × £{selected.price.toFixed(0)}</p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!selected || added || selectedSoldOut}
            className={clsx(
              "flex min-h-[56px] min-w-[170px] items-center justify-center gap-2 rounded-2xl text-base font-bold uppercase tracking-wider transition-all",
              added
                ? "bg-emerald-500/20 text-emerald-300"
                : selectedSoldOut
                  ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-[0.97]"
            )}
          >
            {added ? "✓ Added" : selectedSoldOut ? "Sold Out" : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shipping info */}
      <div className="rounded-2xl bg-[#1C1C1E] px-5 py-4 text-sm text-neutral-400 space-y-1.5">
        <p>🚚 Ships across the UK including Northern Ireland</p>
        <p>📦 Vacuum-sealed, discreet packaging</p>
        <p>💷 £5 delivery fee per order</p>
      </div>
    </div>
  );
}
