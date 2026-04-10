"use client";

import { useState, useCallback } from "react";
import type { DeliveryLocation } from "@/lib/delivery-api";
import {
  isNorthernIreland,
  searchInPostLockers,
  searchOOHPodLockers,
  searchYodelStores,
  geocodePostcode,
} from "@/lib/delivery-api";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

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
  const [error, setError] = useState("");

  const search = useCallback(async () => {
    if (!postcode || postcode.length < 4) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      if (!isNI) {
        // Mainland GB → InPost
        const locs = await searchInPostLockers(postcode, 5000, 10);
        setResults(locs);
      } else {
        // Northern Ireland
        const geo = await geocodePostcode(postcode);
        if (!geo) {
          setError("Could not locate that postcode. Please check and try again.");
          return;
        }
        if (tab === "oohpod_locker") {
          const locs = await searchOOHPodLockers(geo.lat, geo.lng, 10);
          setResults(locs);
        } else {
          const locs = await searchYodelStores(geo.lat, geo.lng, 10);
          setResults(locs);
        }
      }
    } catch {
      setError("Failed to load locations. Please try again.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [postcode, isNI, tab]);

  const formatDist = (m?: number) => {
    if (!m) return "";
    const miles = m / 1609.34;
    return miles >= 0.1 ? `${miles.toFixed(1)} mi` : `< 0.1 mi`;
  };

  return (
    <div className="space-y-3">
      {/* NI info banner */}
      {isNI && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
          <p className="text-xs text-amber-200">
            🚢 Northern Ireland — delivered via Yodel
          </p>
        </div>
      )}

      {/* Tabs for NI */}
      {isNI && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTab("oohpod_locker"); setResults([]); setSearched(false); }}
            className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
              tab === "oohpod_locker"
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/40 border border-white/10"
            }`}
          >
            🔐 24/7 Locker
            <span className="block text-[9px] font-normal mt-0.5 opacity-60">OOHPod · 67 locations</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab("yodel_store"); setResults([]); setSearched(false); }}
            className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
              tab === "yodel_store"
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                : "bg-white/[0.04] text-white/40 border border-white/10"
            }`}
          >
            🏪 Collection Point
            <span className="block text-[9px] font-normal mt-0.5 opacity-60">Yodel stores · 202 locations</span>
          </button>
        </div>
      )}

      {/* Mainland label */}
      {!isNI && (
        <p className="text-[10px] text-white/30">🔐 InPost Locker · 16,000+ locations · 24/7</p>
      )}

      {/* Search button */}
      <button
        type="button"
        onClick={search}
        disabled={loading || !postcode || postcode.length < 4}
        className="flex w-full min-h-[40px] items-center justify-center rounded-xl border border-white/15 text-xs font-bold text-white hover:bg-white/[0.04] disabled:opacity-30 transition"
      >
        {loading ? (
          <span className="animate-pulse">Searching…</span>
        ) : (
          <>📍 Find nearby {isNI ? (tab === "oohpod_locker" ? "lockers" : "collection points") : "lockers"}</>
        )}
      </button>

      {error && <p className="text-[10px] text-red-300">{error}</p>}

      {/* Results */}
      {searched && results.length === 0 && !loading && !error && (
        <p className="text-[10px] text-white/30 text-center py-2">
          No locations found near {postcode}. Try a different postcode.
        </p>
      )}

      {results.length > 0 && (
        <div className="max-h-[300px] overflow-y-auto space-y-1.5 scrollbar-thin">
          {results.map((loc) => {
            const isSelected = selected?.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelect(loc)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isSelected ? "text-emerald-300" : "text-white"}`}>
                      {isSelected && "✓ "}{loc.name}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5 truncate">{loc.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-white/25">{loc.postcode}</span>
                      <span className="text-[9px] text-white/20">·</span>
                      <span className="text-[9px] text-emerald-300/50">{loc.opening}</span>
                    </div>
                  </div>
                  {loc.distance !== undefined && loc.distance > 0 && (
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/40">
                      {formatDist(loc.distance)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected summary */}
      {selected && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-emerald-300/50 mb-1">Selected pickup point</p>
          <p className="text-xs font-bold text-white">{selected.name}</p>
          <p className="text-[10px] text-white/40">{selected.address} · {selected.postcode}</p>
        </div>
      )}
    </div>
  );
}
