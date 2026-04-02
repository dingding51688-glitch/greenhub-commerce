"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher } from "@/lib/api";
import type { ProductsResponse } from "@/lib/types";

const PLACEHOLDER_RESULTS = ["Berry Kush", "Midnight Gelato", "Caramel Cake", "Locker bundle"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") || "";
  const [term, setTerm] = useState(initial);

  const query = term.trim().length >= 2 ? term.trim() : null;
  const key = query
    ? `/api/products?filters%5Btitle%5D%5B$containsi%5D=${encodeURIComponent(query)}&populate%5BweightOptions%5D=*`
    : null;

  const { data, isLoading } = useSWR<ProductsResponse>(key, swrFetcher);
  const results = useMemo(() => data?.data ?? [], [data]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(term)}`, { scroll: false });
  };

  return (
    <section className="space-y-6 pb-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-ink-500">Search</p>
        <h1 className="text-3xl font-semibold text-white">Find strains, lockers, or bundles</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Try “Caramel Cake”"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={term.trim().length < 2}>
            Search
          </Button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs text-ink-500">
          {PLACEHOLDER_RESULTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setTerm(item);
                router.replace(`/search?q=${encodeURIComponent(item)}`, { scroll: false });
              }}
              className="rounded-full border border-ink-700 px-3 py-1 hover:border-plum-500 hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {query === null && <p className="text-sm text-ink-500">Enter at least two characters to search the live menu.</p>}
        {query !== null && isLoading && (
          <div className="space-y-2">
            <p className="text-sm text-ink-500">Searching <span className="font-semibold text-white">{query}</span>…</p>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-40" />
              ))}
            </div>
          </div>
        )}
        {query !== null && !isLoading && results.length === 0 && (
          <p className="text-sm text-ink-500">No products matched “{query}”. Try a different strain or weight.</p>
        )}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((product) => (
              <ProductCard key={product.documentId} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
