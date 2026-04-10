"use client";

import clsx from "clsx";
import useSWR from "swr";
import { useMemo } from "react";
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
  const products = useMemo(() => data?.data ?? [], [data]);

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
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={clsx(
              "flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition whitespace-nowrap",
              category === tab
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/50 border border-white/8 hover:text-white/80"
            )}
            onClick={() => handleCategoryChange(tab)}
          >
            <span>{tabEmojis[tab]}</span>
            <span>{tab === "shop-all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}</span>
          </button>
        ))}
      </div>

      {/* Category header */}
      <div>
        <h1 className="text-lg font-bold text-white sm:text-2xl">{hero.title}</h1>
        <p className="mt-1 text-xs text-white/40 sm:text-sm">{hero.description}</p>
      </div>

      {/* Product count */}
      {!isLoading && products.length > 0 && (
        <p className="text-[10px] uppercase tracking-wider text-white/30">{products.length} products</p>
      )}

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
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-2 text-sm font-medium text-white/60">No products in this category yet</p>
          <p className="mt-1 text-xs text-white/30">Check back soon or browse another category</p>
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

      {/* Support CTA */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 sm:px-6">
        <p className="text-sm font-semibold text-white">Need help choosing?</p>
        <p className="mt-1 text-xs text-white/40">Message our team and we&apos;ll recommend the best products for you.</p>
        <Button asChild variant="ghost" size="sm" className="mt-2">
          <a href="/support">Contact support</a>
        </Button>
      </div>
    </div>
  );
}
