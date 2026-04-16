"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ProductCard } from "@/components/ProductCard";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import type { ProductRecord } from "@/lib/types";
import { searchProducts } from "@/lib/search-api";

const RECENT_KEY = "gh_recent_searches";
const strainOptions = ["Hybrid", "Indica", "Sativa", "CBD"];
const potencyOptions = ["Balanced", "Medium", "Strong", "Ultra"];

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params?.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [activeQuery, setActiveQuery] = useState(initialQ);
  const [filters, setFilters] = useState({ strain: "", potency: "" });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // Auto-focus search input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = params?.get("q") ?? "";
    setQuery(q);
    setActiveQuery(q);
  }, [params]);

  const swrKey = useMemo(() => {
    if (!activeQuery && !filters.strain && !filters.potency) return null;
    return ["product-search", activeQuery, filters.strain, filters.potency];
  }, [activeQuery, filters]);

  const { data, error, isLoading, mutate } = useSWR<ProductRecord[]>(swrKey, () =>
    searchProducts({
      q: activeQuery,
      strain: filters.strain || undefined,
      potency: filters.potency || undefined,
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setActiveQuery(trimmed);
    if (trimmed) {
      saveRecent(trimmed);
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const saveRecent = (term: string) => {
    if (typeof window === "undefined" || !term) return;
    const next = [term, ...recentSearches.filter((i) => i !== term)].slice(0, 5);
    setRecentSearches(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const applyRecent = (term: string) => {
    setQuery(term);
    setActiveQuery(term);
    saveRecent(term);
    router.replace(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(RECENT_KEY);
  };

  const hasQueryOrFilter = Boolean(activeQuery || filters.strain || filters.potency);
  const results = data ?? [];

  const toggleFilter = (key: "strain" | "potency", value: string) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 transition"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setActiveQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 active:text-white/60">✕</button>
          )}
        </div>
        <button type="submit"
          className="shrink-0 rounded-xl cta-gradient px-4 min-h-[44px] text-sm font-bold text-white active:scale-[0.98]">
          Search
        </button>
      </form>

      {/* Quick filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {strainOptions.map((s) => (
            <button key={s} type="button" onClick={() => toggleFilter("strain", s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.strain === s
                  ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                  : "bg-white/[0.04] text-white/50 border border-white/8"
              }`}>
              {s}
            </button>
          ))}
          <span className="text-white/10 self-center">|</span>
          {potencyOptions.map((p) => (
            <button key={p} type="button" onClick={() => toggleFilter("potency", p)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.potency === p
                  ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                  : "bg-white/[0.04] text-white/50 border border-white/8"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Recent searches */}
      {!hasQueryOrFilter && recentSearches.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Recent</p>
            <button onClick={clearRecent} className="text-[10px] text-white/25 active:text-white/40">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button key={term} onClick={() => applyRecent(term)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 active:bg-white/[0.08]">
                🔍 {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasQueryOrFilter && recentSearches.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-sm font-medium text-white/60">Search for products</p>
          <p className="mt-1 text-xs text-white/30">By name, strain, or use the filters above</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <StateMessage
          variant="error"
          title="Search failed"
          body={error.message}
          actionLabel="Retry"
          onAction={() => mutate()}
        />
      )}

      {/* No results */}
      {hasQueryOrFilter && !isLoading && !error && results.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-3xl">😔</p>
          <p className="mt-2 text-sm font-medium text-white/60">No products found</p>
          <p className="mt-1 text-xs text-white/30">Try a different keyword or reset filters</p>
          <button onClick={() => { setFilters({ strain: "", potency: "" }); setActiveQuery(""); setQuery(""); }}
            className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 active:bg-white/5">
            Reset all
          </button>
        </div>
      )}

      {/* Results */}
      {hasQueryOrFilter && !isLoading && !error && results.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wider text-white/30">{results.length} results</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.documentId} product={product} variant="compact" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
