"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { ProductRecord } from "@/lib/types";

export type FavoriteToggleProps = {
  product: ProductRecord;
  layout?: "icon" | "pill";
};

export function FavoriteToggle({ product, layout = "icon" }: FavoriteToggleProps) {
  const router = useRouter();
  const { token, addFavorite, removeFavorite, isFavorite } = useAuth();
  const favorite = isFavorite(product.id);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = async () => {
    if (!token) {
      router.push("/register");
      return;
    }
    setPending(true);
    try {
      if (favorite) {
        await removeFavorite(product.id);
        setToast("Removed");
      } else {
        await addFavorite(product);
        setToast("Saved");
      }
    } catch (error: any) {
      setToast(error?.message || "Failed");
    } finally {
      setPending(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={favorite}
        aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
        className={`flex items-center gap-2 text-xs font-semibold transition ${
          favorite ? "border-rose-400/50 bg-rose-500/10 text-rose-100" : "border-white/20 text-white/70 hover:border-white/60"
        } ${layout === "icon" ? "rounded-full border px-2 py-2" : "rounded-full border px-3 py-2"}`}
      >
        <HeartIcon filled={favorite} />
        {layout === "pill" && <span>{favorite ? "Favorited" : "Save"}</span>}
      </button>
      {toast && <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">{toast}</span>}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M12 20s-6.5-4.35-9-8.24C1.16 9.27 1.62 6.4 3.8 5.17 6 3.95 8.46 4.8 9.5 6.88c1.04-2.08 3.5-2.93 5.7-1.7 2.18 1.23 2.63 4.1.8 6.59C18.5 15.65 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
