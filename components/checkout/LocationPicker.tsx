"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DeliveryLocation } from "@/lib/delivery-api";
import {
  isNorthernIreland,
  searchInPostLockers,
  searchOOHPodLockers,
  searchYodelStores,
  geocodePostcode,
} from "@/lib/delivery-api";

type Tab = "oohpod_locker" | "yodel_store";

type Props = {
  postcode: string;
  onSelect: (loc: DeliveryLocation) => void;
  selected: DeliveryLocation | null;
};

export default function LocationPicker({ postcode, onSelect, selected }: Props) {
  const isNI = isNorthernIreland(postcode);
  const [tab, setTab] = useState<Tab>("oohpod_locker");
  const [results, setResults] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const lastSearchRef = useRef("");

  // Auto-search when postcode is valid (5+ chars) or tab changes
  const search = useCallback(async (forceTab?: Tab) => {
    const pc = (postcode || "").trim();
    if (pc.length < 5) return;
    const activeTab = forceTab || tab;
    const cacheKey = `${pc}:${isNI}:${activeTab}`;
    if (cacheKey === lastSearchRef.current) return;
    lastSearchRef.current = cacheKey;

    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);
    setExpanded(false);

    try {
      if (!isNI) {
        const locs = await searchInPostLockers(pc, 8000, 10);
        setResults(locs);
      } else {
        const geo = await geocodePostcode(pc);
        if (!geo) {
          setError("Could not locate that postcode");
          return;
        }
        if (activeTab === "oohpod_locker") {
          setResults(await searchOOHPodLockers(geo.lat, geo.lng, 10));
        } else {
          setResults(await searchYodelStores(geo.lat, geo.lng, 10));
        }
      }
    } catch {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [postcode, isNI, tab]);

  // Debounced auto-search
  useEffect(() => {
    const pc = (postcode || "").trim();
    if (pc.length < 5) return;
    const timer = setTimeout(() => search(), 600);
    return () => clearTimeout(timer);
  }, [postcode, search]);

  const formatDist = (m?: number) => {
    if (!m) return "";
    const miles = m / 1609.34;
    return miles >= 0.1 ? `${miles.toFixed(1)} mi` : "< 0.1 mi";
  };

  // Show top 3, expand for more
  const visible = expanded ? results : results.slice(0, 3);
  const hasMore = results.length > 3;

  return (
    <div className="space-y-2">
      {/* NI info banner */}
      {isNI && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
          <p className="text-xs text-amber-200">🚢 Northern Ireland — delivered via Yodel</p>
        </div>
      )}

      {/* Tabs for NI */}
      {isNI && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTab("oohpod_locker"); lastSearchRef.current = ""; search("oohpod_locker"); }}
            className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-bold transition ${
              tab === "oohpod_locker"
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/40 border border-white/10"
            }`}
          >
            🔐 24/7 Locker
          </button>
          <button
            type="button"
            onClick={() => { setTab("yodel_store"); lastSearchRef.current = ""; search("yodel_store"); }}
            className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-bold transition ${
              tab === "yodel_store"
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/40 border border-white/10"
            }`}
          >
            🏪 Collection Point
          </button>
        </div>
      )}

      {/* Label */}
      {!isNI && (
        <p className="text-[10px] text-white/30">🔐 InPost Lockers & Shops · 16,000+ locations</p>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-[10px] text-white/30 text-center py-2 animate-pulse">Searching nearby…</p>
      )}

      {error && <p className="text-[10px] text-red-300">{error}</p>}

      {/* No results */}
      {searched && results.length === 0 && !loading && !error && (
        <p className="text-[10px] text-white/30 text-center py-2">
          No locations found. Try a different postcode.
        </p>
      )}

      {/* Results — top 3 by default */}
      {visible.length > 0 && (
        <div className="space-y-1.5">
          {visible.map((loc) => {
            const isSel = selected?.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelect(loc)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  isSel
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <p className={`text-[11px] font-bold leading-snug ${isSel ? "text-emerald-300" : "text-white"}`}>
                  {isSel && "✓ "}{loc.type === "inpost_shop" ? "🏪 " : "🔐 "}{loc.name}
                </p>
                {loc.address && (
                  <p className="text-[10px] text-white/40 mt-1 leading-snug">{loc.address}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-emerald-300/50">{loc.opening}</span>
                  {loc.distance !== undefined && loc.distance > 0 && (
                    <>
                      <span className="text-[9px] text-white/10">·</span>
                      <span className="text-[9px] text-white/30">{formatDist(loc.distance)}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}

          {/* Show more / less */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full py-1.5 text-[10px] text-white/30 hover:text-white/50 transition"
            >
              {expanded ? "Show less ↑" : `Show ${results.length - 3} more ↓`}
            </button>
          )}
        </div>
      )}

      {/* Selected summary */}
      {selected && !visible.find((l) => l.id === selected.id) && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-emerald-300/50 mb-0.5">Selected</p>
          <p className="text-[11px] font-bold text-white">{selected.name}</p>
          <p className="text-[9px] text-white/40">{selected.postcode}</p>
        </div>
      )}
    </div>
  );
}
