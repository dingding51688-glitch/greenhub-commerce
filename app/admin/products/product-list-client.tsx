"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const CMS_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.greenhub420.co.uk";
function strapiUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${CMS_BASE}${url}`;
}

type ProductItem = {
  id: number;
  title: string;
  slug: string;
  priceFrom: number;
  inStock: boolean;
  strain?: string;
  featuredImage?: { id: number; url: string } | null;
  weightOptions?: Array<{ label: string; price: number }>;
};

export function ProductListClient({ initialProducts }: { initialProducts: ProductItem[] }) {
  const { token } = useAuth();
  const [products, setProducts] = useState(initialProducts);
  const [toggling, setToggling] = useState<number | null>(null);

  const toggleStock = async (productId: number, currentStock: boolean) => {
    if (!token) return;
    setToggling(productId);
    try {
      const res = await fetch(`/api/strapi/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { inStock: !currentStock } }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, inStock: !currentStock } : p))
        );
      }
    } catch (e) {
      console.error("Toggle stock failed", e);
    } finally {
      setToggling(null);
    }
  };

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;

  if (!token) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#080808] p-8 text-center text-white/60">
        请先登录管理员账号
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400/60">在售</p>
          <p className="text-lg font-bold text-emerald-300">{inStockCount}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2">
          <p className="text-[10px] uppercase tracking-wider text-red-400/60">缺货</p>
          <p className="text-lg font-bold text-red-300">{outOfStockCount}</p>
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`flex items-center gap-4 rounded-2xl border p-3 transition ${
              product.inStock
                ? "border-white/8 bg-white/[0.02]"
                : "border-red-500/15 bg-red-500/[0.02]"
            }`}
          >
            {/* Image */}
            <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-black/40">
              {product.featuredImage?.url ? (
                <Image
                  src={strapiUrl(product.featuredImage.url)}
                  alt={product.title}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xl text-white/20">🌿</div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-white">{product.title}</h3>
                {!product.inStock && (
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-300">
                    缺货
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                {product.strain && <span>{product.strain}</span>}
                <span>£{product.priceFrom}</span>
                {product.weightOptions && product.weightOptions.length > 0 && (
                  <span>{product.weightOptions.length} 规格</span>
                )}
              </div>
            </div>

            {/* Stock toggle */}
            <button
              onClick={() => toggleStock(product.id, product.inStock)}
              disabled={toggling === product.id}
              className={`flex h-10 w-20 items-center justify-center rounded-xl text-xs font-bold transition ${
                product.inStock
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
              } ${toggling === product.id ? "opacity-50" : ""}`}
            >
              {toggling === product.id ? "..." : product.inStock ? "✅ 在售" : "❌ 缺货"}
            </button>

            {/* Edit link */}
            <Link
              href={`/admin/products/${product.id}`}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
            >
              编辑
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
