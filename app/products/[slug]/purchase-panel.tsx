"use client";

import clsx from "clsx";
import { useState } from "react";
import Button from "@/components/ui/button";
import type { ProductRecord, WeightOption } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";

const MIN_QTY = 1;
const MAX_QTY = 5;

const FALLBACK_WEIGHT_OPTIONS: WeightOption[] = [
  { id: 1001, label: "3.5g", price: 35, unitPrice: "£10/g" },
  { id: 1002, label: "7g", price: 60, unitPrice: "£8.57/g" },
  { id: 1003, label: "14g", price: 110, unitPrice: "£7.85/g" },
  { id: 1004, label: "28g", price: 180, unitPrice: "£6.42/g", featured: true }
];

function formatUnitPrice(option: WeightOption) {
  if (option.unitPrice) return option.unitPrice;
  const match = option.label.match(/([\d.]+)\s*g/i);
  if (match) {
    const grams = parseFloat(match[1]);
    if (!Number.isNaN(grams) && grams > 0) {
      return `£${(option.price / grams).toFixed(2)}/g`;
    }
  }
  return "Locker ready";
}

export function ProductDetailPurchase({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const { addItem } = useCart();
  const rawOptions = product.weightOptions ?? [];
  const normalizedOptions = rawOptions.length > 0 ? rawOptions : FALLBACK_WEIGHT_OPTIONS;
  const limitedOptions = normalizedOptions.slice(0, 4);
  const [selectedId, setSelectedId] = useState<number | null>(limitedOptions[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const displayOptions = limitedOptions.map((option) => {
    const highlight = option.featured || option.label.toLowerCase().includes("28");
    return {
      ...option,
      displayUnitPrice: formatUnitPrice(option),
      highlight
    };
  });

  const selected = displayOptions.find((option) => option.id === selectedId) ?? displayOptions[0] ?? null;

  const handleAddToCart = () => {
    if (!selected) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.coverImage?.url ?? null,
      weight: selected.label,
      unitPrice: selected.price,
      quantity,
    });
    setAdded(true);
    setTimeout(() => router.push("/cart"), 600);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.min(MAX_QTY, Math.max(MIN_QTY, prev + delta)));
  };

  return (
    <div className="flex flex-col gap-6 rounded-[40px] border border-white/10 bg-[#050708] p-6 text-white shadow-card">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/50">Weight</p>
        <h2 className="text-2xl font-semibold text-white">Choose your weight</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {displayOptions.map((option) => {
          const isActive = selected?.id === option.id;
          const showMostChosen = option.highlight;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={clsx(
                "relative rounded-2xl border border-[#1F242A] bg-[#0F1114] px-3 py-3 text-left text-[#F5F5F5] shadow-sm transition hover:-translate-y-0.5",
                isActive && "border-emerald-400 bg-[#11171C] shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
              )}
            >
              {showMostChosen && (
                <span className="absolute right-2 top-2 rounded-full border border-emerald-400 bg-transparent px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                  Popular
                </span>
              )}
              {isActive && (
                <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[#0B0F0D]">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                    <path d="M20 6.5L9.5 17l-5.5-5.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <div className="flex flex-col gap-1 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C9CFD4]">{option.label}</p>
                <p className="text-xl font-semibold text-[#F5F5F5]">£{option.price.toFixed(0)}</p>
                <p className="text-xs text-[#C9CFD4]">{option.displayUnitPrice}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-[32px] border border-white/15 bg-[#0F1215] px-5 py-4 text-[#F5F5F5]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#F5F5F5]/70">Quantity</p>
          <p className="text-3xl font-semibold text-[#F5F5F5]">{quantity}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-transparent text-2xl font-semibold text-white disabled:opacity-30"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity === MIN_QTY}
            aria-label="Decrease quantity"
          >
            –
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-transparent text-2xl font-semibold text-white disabled:opacity-30"
            onClick={() => adjustQuantity(1)}
            disabled={quantity === MAX_QTY}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!selected || added}
        className="w-full rounded-[30px] border-2 border-[#0B0F0D] bg-[#23A26D] text-[#0B0F0D] font-semibold tracking-wide hover:bg-[#1F8B5D]"
      >
        {added ? "✓ ADDED — GOING TO CART" : "ADD TO CART"}
      </Button>

      <div className="rounded-[32px] border border-white/15 bg-[#0A0C0E] p-5 text-sm text-[#EDEDED]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Where we ship</p>
        <p className="mt-1 text-base font-semibold text-white">We ship across the United Kingdom.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[#EDEDED]">
          <li>England</li>
          <li>Scotland</li>
          <li>Wales</li>
        </ul>
        <p className="mt-3 text-sm text-[#EDEDED]/80">We do NOT ship to Northern Ireland.</p>
        <p className="text-sm text-[#EDEDED]/80">Orders are vacuum-sealed and discreetly packaged. Tracking number will be provided within 24 hours.</p>
      </div>
    </div>
  );
}
