"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { StateMessage } from "@/components/StateMessage";
import type { ProductRecord } from "@/lib/types";
import { searchProducts } from "@/lib/search-api";

const RECENT_KEY = "gh_recent_searches";
const strainOptions = ["Hybrid", "Indica", "Sativa", "CBD"];
const potencyOptions = ["Balanced", "Medium", "Strong", "Ultra"];
const thcOptions = ["18%", "20%", "25%", "30%"];

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params?.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [activeQuery, setActiveQuery] = useState(initialQ);
  const [filters, setFilters] = useState({ strain: "", potency: "", thc: "" });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(RECENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed as string[]);
        }
      } catch (error) {
        console.warn("Unable to parse recent searches", error);
      }
    }
  }, []);

  useEffect(() => {
    const q = params?.get("q") ?? "";
    setQuery(q);
    setActiveQuery(q);
  }, [params]);

  const swrKey = useMemo(() => {
    if (!activeQuery && !filters.strain && !filters.potency && !filters.thc) {
      return null;
    }
    return ["product-search", activeQuery, filters.strain, filters.potency, filters.thc];
  }, [activeQuery, filters]);

  const { data, error, isLoading, mutate } = useSWR<ProductRecord[]>(swrKey, () =>
    searchProducts({
      q: activeQuery,
      strain: filters.strain || undefined,
      potency: filters.potency || undefined,
      thc: filters.thc || undefined
    })
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    setActiveQuery(trimmed);
    if (trimmed) {
      saveRecent(trimmed);
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const saveRecent = (term: string) => {
    if (typeof window === "undefined" || !term) return;
    const next = [term, ...recentSearches.filter((item) => item !== term)].slice(0, 5);
    setRecentSearches(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const applyRecent = (term: string) => {
    setQuery(term);
    setActiveQuery(term);
    saveRecent(term);
    router.replace(`/search?q=${encodeURIComponent(term)}`);
  };

  const hasQueryOrFilter = Boolean(activeQuery || filters.strain || filters.potency || filters.thc);

  const results = data ?? [];

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-night-950/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Search</p>
        <h1 className="text-3xl font-semibold text-white">Find a product</h1>
        <p className="mt-2 text-sm text-white/60">Search by name, strain, or THC potency. Filters refine results in real time.</p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <input
            type="search"
            placeholder="Search strain, category, terp profile…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40"
          />
          <Button type="submit" className="w-full sm:w-auto">
            Search products
          </Button>
        </form>
        {recentSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
            <span className="uppercase tracking-[0.3em] text-white/30">Recent</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                className="rounded-full border border-white/15 px-3 py-1 text-white/70 transition hover:border-white/50"
                onClick={() => applyRecent(term)}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </header>

      <FilterPanel filters={filters} setFilters={setFilters} />

      {!hasQueryOrFilter && (
        <Card className="border border-dashed border-white/15 bg-night-950/50 p-6 text-sm text-white/60">
          Type a search query or apply a filter to see results.
        </Card>
      )}

      {hasQueryOrFilter && (
        <div className="space-y-4">
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-3xl bg-white/5" />
              ))}
            </div>
          )}
          {error && (
            <StateMessage
              variant="error"
              title="Unable to search products"
              body={error.message}
              actionLabel="Retry"
              onAction={() => mutate()}
            />
          )}
          {!isLoading && !error && results.length === 0 && (
            <StateMessage
              variant="empty"
              title="No products match your filters"
              body="Try a different keyword or reset the filters."
              actionLabel="Reset filters"
              onAction={() => {
                setFilters({ strain: "", potency: "", thc: "" });
                setActiveQuery("");
                setQuery("");
                router.replace("/search");
              }}
            />
          )}
          {!isLoading && !error && results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((product) => (
                <ProductCard key={product.documentId} product={product} variant="list" />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type FilterPanelProps = {
  filters: { strain: string; potency: string; thc: string };
  setFilters: React.Dispatch<React.SetStateAction<{ strain: string; potency: string; thc: string }>>;
};

function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const toggleValue = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));
  };

  return (
    <Card className="space-y-4 border border-white/10 bg-night-950/70 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Strain</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {strainOptions.map((option) => (
            <Chip key={option} active={filters.strain === option} onClick={() => toggleValue("strain", option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Potency</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {potencyOptions.map((option) => (
            <Chip key={option} active={filters.potency === option} onClick={() => toggleValue("potency", option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">THC</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {thcOptions.map((option) => (
            <Chip key={option} active={filters.thc === option} onClick={() => toggleValue("thc", option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  );
}

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? "border border-white text-white" : "border border-white/20 text-white/70 hover:border-white/60"
      }`}
    >
      {children}
    </button>
  );
}
