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

function unitPrice(o: WeightOption) {
  if (o.unitPrice) return o.unitPrice;
  const m = o.label.match(/([\d.]+)\s*g/i);
  if (m) { const g = parseFloat(m[1]); if (g > 0) return `£${(o.price / g).toFixed(2)}/g`; }
  return "";
}

export function ProductDetailPurchase({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const { addItem } = useCart();
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

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      {/* Weight selector */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Select Weight</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((o) => {
          const active = selected?.id === o.id;
          const popular = o.featured || o.label.toLowerCase().includes("28");
          return (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={clsx(
                "relative rounded-xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15"
              )}
            >
              {popular && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[7px] font-bold uppercase text-emerald-300">
                  Popular
                </span>
              )}
              <p className="text-[10px] text-white/40">{o.label}</p>
              <p className="text-base font-bold text-white">£{o.price.toFixed(0)}</p>
              {unitPrice(o) && <p className="text-[9px] text-white/25">{unitPrice(o)}</p>}
            </button>
          );
        })}
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/30">Qty</p>
          <p className="text-xl font-bold text-white">{qty}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setQty((q) => Math.max(MIN_QTY, q - 1))}
            disabled={qty === MIN_QTY}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-white disabled:opacity-20"
          >–</button>
          <button
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty === MAX_QTY}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-white disabled:opacity-20"
          >+</button>
        </div>
      </div>

      {/* Total + Add to cart */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[9px] text-white/30">Total</p>
          <p className="text-xl font-bold text-white">£{((selected?.price ?? 0) * qty).toFixed(0)}</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={!selected || added}
          className={clsx(
            "flex min-h-[48px] flex-1 items-center justify-center rounded-xl text-sm font-bold uppercase tracking-wider transition",
            added ? "bg-emerald-400/20 text-emerald-300" : "cta-gradient text-white"
          )}
        >
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>

      {/* Shipping info */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] text-white/25 space-y-0.5">
        <p>🚚 Ships across England, Scotland & Wales</p>
        <p>📦 Vacuum-sealed, discreet packaging</p>
        <p>⚠️ We do NOT ship to Northern Ireland</p>
      </div>
    </div>
  );
}
