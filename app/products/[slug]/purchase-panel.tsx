"use client";

import { useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import type { ProductRecord, WeightOption } from "@/lib/types";
import { useRouter } from "next/navigation";

export function ProductDetailPurchase({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const options = product.weightOptions ?? [];
  const [selected, setSelected] = useState<WeightOption | null>(options.find((option) => option.featured) || options[0] || null);

  const handleCheckout = () => {
    const params = new URLSearchParams();
    params.set("product", product.slug);
    if (selected) params.set("weight", selected.label);
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <Card padding="lg" className="bg-night-900/80">
      <h2 className="text-lg font-semibold text-white">Select a weight</h2>
      <div className="mt-4 grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option)}
            className={`rounded-2xl border px-4 py-3 text-left ${
              selected?.id === option.id
                ? "border-plum-500 bg-plum-500/10 text-white"
                : "border-ink-800 bg-night-950/60 text-ink-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">{option.label}</span>
              <span className="text-lg font-semibold text-white">£{option.price.toFixed(2)}</span>
            </div>
            <p className="text-xs text-ink-500">{option.unitPrice}</p>
          </button>
        ))}
        {options.length === 0 && <p className="text-sm text-ink-500">Weight options coming soon.</p>}
      </div>
      <Button onClick={handleCheckout} className="mt-4 w-full" disabled={!selected}>
        Checkout locker drop
      </Button>
    </Card>
  );
}
