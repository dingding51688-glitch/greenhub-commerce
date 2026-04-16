"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { faqCategories, flatFaqEntries } from "@/data/fixtures/faq";

export default function FaqPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialCategory = searchParams?.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCategory(initialCategory); }, [initialCategory]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = category === "all"
      ? flatFaqEntries
      : flatFaqEntries.filter((e: any) => e.category === category);
    if (!q) return source;
    return source.filter((e) =>
      e.question.toLowerCase().includes(q) ||
      e.answer.toLowerCase().includes(q) ||
      e.keywords?.some((k: string) => k.toLowerCase().includes(q))
    );
  }, [category, query]);

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setOpenId(null);
    const params = new URLSearchParams(searchParams?.toString());
    if (next === "all") params.delete("category");
    else params.set("category", next);
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Help Center</h1>
        <p className="mt-1 text-xs text-white/40">Find answers to common questions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search questions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-10 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 transition"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 active:text-white/60">✕</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
        {faqCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`shrink-0 snap-start rounded-full px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              category === cat.id
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/50 border border-white/8"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-[10px] uppercase tracking-wider text-white/30">
        {entries.length} {entries.length === 1 ? "question" : "questions"}
        {query && ` matching "${query}"`}
      </p>

      {/* FAQ list — accordion */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-sm font-medium text-white/60">No questions found</p>
          <p className="mt-1 text-xs text-white/30">Try a different keyword or category</p>
          <button onClick={() => { setQuery(""); handleCategoryChange("all"); }}
            className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 active:bg-white/5">
            Reset
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-white/[0.03]"
                >
                  <p className={`text-sm font-semibold pr-3 ${isOpen ? "text-emerald-300" : "text-white"}`}>
                    {entry.question}
                  </p>
                  <span className={`shrink-0 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="h-px bg-white/5 mb-3" />
                    <p className="text-sm leading-relaxed text-white/60">{entry.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support CTA */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Still need help?</p>
            <p className="mt-0.5 text-xs text-white/40">Our team is available daily 09:00–21:00 GMT</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href="/support"
            className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white active:scale-[0.98]">
            Contact Support
          </Link>
          <Link href="/how-it-works"
            className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white/60 active:scale-[0.98]">
            How It Works
          </Link>
        </div>
      </div>
    </div>
  );
}
