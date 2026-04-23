"use client";

import clsx from "clsx";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import Button from "@/components/ui/button";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher } from "@/lib/api";
import type { ProductsResponse } from "@/lib/types";
import { productCategoryContent, type ProductCategoryKey } from "@/data/fixtures/products";

const CATEGORY_TABS: ProductCategoryKey[] = ["shop-all", "flowers", "pre-rolls", "vapes", "edibles", "concentrates"];

const tabEmojis: Record<string, string> = {
  "shop-all": "🛍️",
  flowers: "🌿",
  "pre-rolls": "🚬",
  vapes: "💨",
  edibles: "🍬",
  concentrates: "🧊",
};

function resolveCategory(value: string | null): ProductCategoryKey {
  if (value && CATEGORY_TABS.includes(value as ProductCategoryKey)) {
    return value as ProductCategoryKey;
  }
  return "shop-all";
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = resolveCategory(searchParams.get("category"));

  const requestParams = new URLSearchParams({
    "pagination[pageSize]": "20",
    "sort[0]": "createdAt:desc",
    "populate[0]": "weightOptions",
    "populate[1]": "featuredImage",
    "populate[2]": "gallery",
  });
  const categoryFilter = productCategoryContent[category].filter;
  if (categoryFilter) {
    requestParams.set(categoryFilter.param, categoryFilter.value);
  }

  const key = `/api/products?${requestParams.toString()}`;
  const { data, isLoading } = useSWR<ProductsResponse>(key, swrFetcher);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

  const products = useMemo(() => {
    const list = data?.data ?? [];
    // In-stock products first
    const sorted = [...list].sort((a, b) => {
      const aHasStock = a.inStock !== false && (a.weightOptions ?? []).some((o) => (o.stock ?? 1) > 0) ? 1 : 0;
      const bHasStock = b.inStock !== false && (b.weightOptions ?? []).some((o) => (o.stock ?? 1) > 0) ? 1 : 0;
      if (aHasStock !== bHasStock) return bHasStock - aHasStock;
      if (sortBy === "price-low") return (a.priceFrom ?? 0) - (b.priceFrom ?? 0);
      if (sortBy === "price-high") return (b.priceFrom ?? 0) - (a.priceFrom ?? 0);
      return 0; // newest = default API order
    });
    return sorted;
  }, [data, sortBy]);

  const handleCategoryChange = (value: ProductCategoryKey) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "shop-all") {
      next.delete("category");
    } else {
      next.set("category", value);
    }
    const query = next.toString();
    router.replace(query ? `/products?${query}` : "/products", { scroll: false });
  };

  const hero = productCategoryContent[category];

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Category tabs - horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={clsx(
              "flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap",
              category === tab
                ? "bg-gradient-to-r from-emerald-400/15 to-cyan-400/10 text-emerald-300 border border-emerald-400/25 shadow-sm shadow-emerald-400/10"
                : "bg-white/[0.03] text-white/40 border border-white/6 hover:text-white/70 hover:border-white/12"
            )}
            onClick={() => handleCategoryChange(tab)}
          >
            <span>{tabEmojis[tab]}</span>
            <span>{tab === "shop-all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}</span>
          </button>
        ))}
      </div>



      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && products.length === 0 && (
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/8 p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 text-sm font-medium text-white/60">No products in this category yet</p>
            <p className="mt-1 text-xs text-white/30">Check back soon or browse another category</p>
          </div>
        </div>
      )}

      {/* Product Grid - 2 columns on mobile */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.documentId} product={product} variant="compact" />
          ))}
        </div>
      )}

      {/* Support CTA - sci-fi style */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-cyan-400/15 px-4 py-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.05] via-transparent to-blue-500/[0.05]" aria-hidden="true" />
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-cyan-400/8 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
            <span className="text-lg">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Need help choosing?</p>
            <p className="mt-0.5 text-[10px] text-white/35">Our AI assistant can recommend the perfect product</p>
          </div>
          <a href="/support" className="shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-[10px] font-semibold text-white shadow-lg shadow-cyan-500/15 active:scale-[0.95] transition">
            Chat
          </a>
        </div>
      </section>
    </div>
  );
}
