"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductRecord } from "@/lib/types";
import { getProductListingMeta } from "@/data/fixtures/products";
import { useCart } from "@/components/providers/CartProvider";

const CMS_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.greenhub420.co.uk";
function strapiMedia(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CMS_BASE}${path}`;
}

interface ProductCardProps {
  product: ProductRecord;
  variant?: "grid" | "list" | "compact";
}

function formatPriceRange(product: ProductRecord) {
  const prices = product.weightOptions?.map((option) => option.price).filter(Boolean);
  if (prices && prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      return `£${min.toFixed(0)}`;
    }
    return `£${min.toFixed(0)}–£${max.toFixed(0)}`;
  }
  return `£${product.priceFrom.toFixed(0)}`;
}

function computeUnitPrice(option: { label: string; price: number; unitPrice?: string }) {
  if (option.unitPrice) return option.unitPrice;
  const m = option.label.match(/([\d.]+)\s*g/i);
  if (m) {
    const g = parseFloat(m[1]);
    if (g > 0) return `£${(option.price / g).toFixed(2)}/g`;
  }
  return "";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const meta = getProductListingMeta(product.slug) ?? {};
  const rating = product.rating ?? 0;
  const potency = product.potency ?? meta.potencyBadge ?? "Medium";
  const featImg = product.featuredImage;
  const imageUrl = strapiMedia(featImg?.url) ?? meta.imageUrl ?? product.coverImage?.url;
  const imageAlt = meta.imageAlt ?? product.coverImage?.alternativeText ?? product.title;
  const priceRange = formatPriceRange(product);
  // Out of stock: explicit flag OR all weight options have stock === 0
  const allWeightsSoldOut = !!(product.weightOptions && product.weightOptions.length > 0 &&
    product.weightOptions.every((w) => w.stock === 0));
  const outOfStock = product.inStock === false || allWeightsSoldOut;

  // Compact card for mobile 2-col grid
  if (variant === "compact") {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={`group flex flex-col overflow-hidden rounded-2xl border transition ${outOfStock ? "border-white/5 opacity-60" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_top,#0d1b13,#050505)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-contain p-3 transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-white/20">🌿</div>
          )}
          {/* Potency badge */}
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white/80">
            {potency}
          </span>
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col px-3 py-2.5">
          {product.strain && (
            <p className="text-[9px] uppercase tracking-wider text-emerald-400/60">{product.strain}</p>
          )}
          <h3 className="mt-0.5 text-sm font-bold leading-tight text-white line-clamp-2">{product.title}</h3>

          {/* Rating - only show if real reviews exist */}
          {rating > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-amber-300">
                <path d="M12 2.5l2.9 6 6.6.5-5 4.4 1.5 6.4L12 16.7 6 19.8l1.5-6.4-5-4.4 6.6-.5z" />
              </svg>
              <span className="text-[10px] font-medium text-amber-200">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Weight/Price grid */}
          {outOfStock ? (
            <p className="mt-auto pt-2 text-xs font-semibold text-red-400/70">All sizes sold out</p>
          ) : product.weightOptions && product.weightOptions.length > 0 ? (
            <WeightPriceGrid product={product} outOfStock={outOfStock} />
          ) : (
            <p className="mt-auto pt-2 text-base font-bold text-emerald-300">{priceRange}</p>
          )}
        </div>
      </Link>
    );
  }

  // Original full card (for detail/list contexts)
  const origin = product.origin ?? meta.origin ?? "🇬🇧 Store verified";
  const reviews = product.reviews ?? 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#0d1b13,#050505)] sm:w-40 sm:flex-none">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 640px) 160px, 100vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">No image</div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/80">
            {potency}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">{product.strain} strain</p>
          <h3 className="text-xl font-semibold text-white">{product.title}</h3>
          <p className="text-sm text-white/50 line-clamp-2">{product.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
            {rating > 0 && (
              <span className="flex items-center gap-1 text-amber-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M12 2.5l2.9 6 6.6.5-5 4.4 1.5 6.4L12 16.7 6 19.8l1.5-6.4-5-4.4 6.6-.5z" />
                </svg>
                {rating.toFixed(1)} ({reviews})
              </span>
            )}
            {product.thc && <span>{product.thc}</span>}
            <span>{origin}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Price</p>
          <p className="text-lg font-bold text-white">{priceRange}</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-semibold text-emerald-300">
          View →
        </span>
      </div>
    </Link>
  );
}

/* ── Weight/Price grid with add-to-cart ── */

const CMS = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.greenhub420.co.uk";

function WeightPriceGrid({ product, outOfStock }: { product: ProductRecord; outOfStock: boolean }) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

  const handleClick = (opt: { id: number; label: string; price: number; stock?: number | null }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    // stock === null/undefined means unlimited; stock === 0 means out of stock
    if (opt.stock === 0) return;

    if (selectedId !== opt.id) {
      // First click: select/highlight
      setSelectedId(opt.id);
      return;
    }

    // Second click: add to cart
    const featImg = product.featuredImage;
    let imgUrl: string | null = null;
    if (featImg?.url) {
      imgUrl = featImg.url.startsWith("http") ? featImg.url : `${CMS}${featImg.url}`;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: imgUrl,
      weight: opt.label,
      unitPrice: opt.price,
      quantity: 1,
    });

    setAddedId(opt.id);
    setSelectedId(null);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className={`mt-auto grid grid-cols-2 gap-1.5 pt-2 ${outOfStock ? "opacity-30" : ""}`}>
      {product.weightOptions!.slice(0, 4).map((opt) => {
        const up = computeUnitPrice(opt);
        const isSelected = selectedId === opt.id;
        const isAdded = addedId === opt.id;
        const optSoldOut = opt.stock === 0;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={outOfStock || optSoldOut}
            onClick={(e) => handleClick(opt, e)}
            className={`relative overflow-hidden rounded-xl border px-2 py-2 text-center transition ${
              optSoldOut
                ? "border-white/5 bg-white/[0.01] opacity-40"
                : isAdded
                  ? "border-emerald-400/40 bg-emerald-400/20"
                  : isSelected
                    ? "border-emerald-400/40 bg-emerald-400/15 ring-1 ring-emerald-400/30"
                    : "border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-emerald-400/25 hover:from-emerald-400/10 hover:to-emerald-400/[0.02] active:scale-95"
            }`}
          >
            {opt.featured && !isAdded && !isSelected && !optSoldOut && (
              <span className="absolute -top-0.5 right-0.5 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[6px] font-bold uppercase text-emerald-300">
                Popular
              </span>
            )}
            {optSoldOut ? (
              <>
                <p className="text-[10px] font-semibold text-white/25">{opt.label}</p>
                <p className="text-[10px] font-bold text-red-400/70">Sold Out</p>
              </>
            ) : isAdded ? (
              <p className="py-1 text-xs font-bold text-emerald-300">✓ Added</p>
            ) : isSelected ? (
              <p className="py-1 text-xs font-bold text-emerald-300">Tap to add 🛒</p>
            ) : (
              <>
                <p className="text-[10px] font-bold text-emerald-400/70">{opt.label}</p>
                <p className="text-base font-extrabold text-white">£{opt.price.toFixed(0)}</p>
                {up && <p className="text-[9px] font-medium text-white/30">{up}</p>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
