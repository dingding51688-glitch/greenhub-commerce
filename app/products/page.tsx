"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import Button from "@/components/ui/button";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher } from "@/lib/api";
import type { ProductsResponse } from "@/lib/types";

const STRAIN_FILTERS = ["all", "Hybrid", "Indica", "Sativa"];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStrain = searchParams.get("strain") || "all";
  const [strain, setStrain] = useState(initialStrain);

  const params = new URLSearchParams({
    "pagination[pageSize]": "12",
    "sort[0]": "createdAt:desc",
    "populate[weightOptions]": "*"
  });
  if (strain !== "all") {
    params.set("filters[strain][$eq]", strain);
  }

  const key = `/api/products?${params.toString()}`;
  const { data, isLoading } = useSWR<ProductsResponse>(key, swrFetcher);
  const products = useMemo(() => data?.data ?? [], [data]);

  const handleFilterChange = (value: string) => {
    setStrain(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      next.delete("strain");
    } else {
      next.set("strain", value);
    }
    router.replace(`/products?${next.toString()}`, { scroll: false });
  };

  return (
    <section className="space-y-6 pb-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-ink-500">Menu</p>
        <h1 className="text-3xl font-semibold text-white">Browse the full locker menu</h1>
        <div className="flex flex-wrap gap-2">
          {STRAIN_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm ${
                strain === option ? "border-plum-500 text-white" : "border-ink-700 text-ink-400"
              }`}
              onClick={() => handleFilterChange(option)}
            >
              {option === "all" ? "All strains" : option}
            </button>
          ))}
        </div>
      </header>

      {isLoading && (
        <div className="space-y-2">
          <p className="text-sm text-ink-500">Loading latest inventory…</p>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-48" />
            ))}
          </div>
        </div>
      )}
      {!isLoading && products.length === 0 && (
        <p className="text-sm text-ink-500">No products available right now. Check back later tonight.</p>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.documentId} product={product} />
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-night-900/50 p-5 text-sm text-ink-500">
        <p className="font-semibold text-white">Need curated help?</p>
        <p>Ping concierge via Telegram or email and we’ll recommend a locker bundle that matches your palette.</p>
        <Button asChild variant="ghost" className="mt-3 w-full sm:w-auto">
          <a href="mailto:concierge@greenhub420.co.uk">Contact concierge</a>
        </Button>
      </div>
    </section>
  );
}
