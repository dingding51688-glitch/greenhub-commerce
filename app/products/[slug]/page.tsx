import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageZoom } from "@/components/ProductImageZoom";
import type { ProductRecord, ProductsResponse } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import { ProductDetailPurchase } from "./purchase-panel";
import { getProductListingMeta } from "@/data/fixtures/products";
import { ProductCard } from "@/components/ProductCard";
import { ReviewSection } from "@/components/ReviewSection";

const CMS_BASE = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
function strapiMedia(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CMS_BASE}${path}`;
}

export async function generateStaticParams() {
  try {
    const data = await serverFetch<ProductsResponse>("/api/products?pagination[pageSize]=50");
    return data.data?.map((product) => ({ slug: product.slug })) ?? [];
  } catch (error) {
    console.warn("Failed to preload product slugs", error);
    return [];
  }
}

async function getProduct(slug: string) {
  const query = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[0]": "weightOptions",
    "populate[1]": "featuredImage",
    "populate[2]": "gallery",
  });
  try {
    const data = await serverFetch<ProductsResponse>(`/api/products?${query.toString()}`);
    return data.data?.[0] ?? null;
  } catch { return null; }
}

async function getRelatedProducts(slug: string) {
  const query = new URLSearchParams({
    "filters[slug][$ne]": slug,
    "pagination[pageSize]": "6",
    "sort[0]": "createdAt:desc",
    "populate[0]": "weightOptions",
    "populate[1]": "featuredImage",
    "populate[2]": "gallery",
  });
  try {
    const data = await serverFetch<ProductsResponse>(`/api/products?${query.toString()}`);
    return data.data ?? [];
  } catch { return []; }
}

function formatPriceRange(product: ProductRecord) {
  const prices = product.weightOptions?.map((o) => o.price);
  if (prices && prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `£${min.toFixed(0)}` : `£${min.toFixed(0)}–£${max.toFixed(0)}`;
  }
  return `From £${product.priceFrom.toFixed(0)}`;
}

async function getReviewMeta(productId: number): Promise<{ avgRating: number; total: number }> {
  try {
    const strapiUrl = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
    const res = await fetch(`${strapiUrl}/api/reviews/product/${productId}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return { avgRating: data?.meta?.avgRating ?? 0, total: data?.meta?.total ?? 0 };
  } catch {
    return { avgRating: 0, total: 0 };
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, related] = await Promise.all([getProduct(params.slug), getRelatedProducts(params.slug)]);
  if (!product) notFound();

  const meta = getProductListingMeta(product.slug);
  const featImg = product.featuredImage;
  const imageUrl = strapiMedia(featImg?.url) ?? product.coverImage?.url ?? meta?.imageUrl;
  const imageAlt = featImg?.alternativeText ?? product.coverImage?.alternativeText ?? meta?.imageAlt ?? product.title;
  const galleryImages = product.gallery?.map((g) => ({ url: strapiMedia(g.url)!, alt: g.alternativeText || product.title })) ?? [];
  const reviewMeta = await getReviewMeta(product.id);
  const rating = reviewMeta.total > 0 ? reviewMeta.avgRating : (product.rating ?? meta?.rating ?? 0);
  const reviews = reviewMeta.total;
  const origin = product.origin ?? meta?.origin ?? "🇬🇧 UK Verified";

  return (
    <div className="space-y-6 pb-24 sm:space-y-10 sm:pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link href="/products" className="hover:text-neutral-300 transition">Shop</Link>
        <span>/</span>
        <span className="text-neutral-400">{product.title}</span>
      </div>

      {/* Hero - stacked on mobile, side-by-side on desktop */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#0d1b13,#050505)]">
          <ProductImageZoom imageUrl={imageUrl} imageAlt={imageAlt} badge={product.heroBadge} gallery={galleryImages} />
        </div>

        {/* Info + Purchase */}
        <div className="space-y-4">
          {/* Product info */}
          <div className="space-y-3">
            {product.strain && (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">{product.strain} strain</p>
            )}
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{product.title}</h1>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-amber-300">
                  <path d="M12 2.5l2.9 6 6.6.5-5 4.4 1.5 6.4L12 16.7 6 19.8l1.5-6.4-5-4.4 6.6-.5z" />
                </svg>
                <span className="text-sm font-semibold text-amber-200">{rating.toFixed(1)}</span>
                <span className="text-xs text-neutral-500">({reviews})</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-400 leading-relaxed">{product.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.thc && (
                <span className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-300">{product.thc}</span>
              )}
              {product.potency && (
                <span className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-300">{product.potency}</span>
              )}
              <span className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-300">{origin}</span>
            </div>
          </div>

          {/* Purchase Panel */}
          <ProductDetailPurchase product={product} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { icon: "📦", title: "Discreet Packaging", desc: "Vacuum-sealed, no labels" },
          { icon: "🔒", title: "16,000+ Lockers", desc: "24/7 InPost collection" },
          { icon: "⚡", title: "3-5 Day Delivery", desc: "Tracking number provided" },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-xl border border-neutral-700/50 bg-[#1C1C1E] px-4 py-3">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <ReviewSection productId={product.id} />

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-white">You might also like</p>
            <Link href="/products" className="text-xs text-neutral-500 hover:text-neutral-300 transition">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.documentId} product={p} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
