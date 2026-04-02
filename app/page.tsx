import Image from "next/image";
import Link from "next/link";
import { HeroClassic, HowItWorksLocker, ProductCollectionGrid, PaymentRecommendation } from "@/components/sections";
import type { ProductCardData, ProductsResponse } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import { featuredCollectionsContent, homeHeroContent } from "@/data/fixtures/marketing";

async function getHighlightedProducts(): Promise<ProductCardData[]> {
  try {
    const params = new URLSearchParams({
      "pagination[page]": "1",
      "pagination[pageSize]": "4",
      "sort[0]": "createdAt:desc",
      "populate[weightOptions]": "*"
    });
    const response = await serverFetch<ProductsResponse>(`/api/products?${params.toString()}`);
    return (response.data || []).map((product) => ({
      id: product.documentId,
      title: product.title,
      category: product.strain,
      description: product.description,
      price: `£${product.priceFrom.toFixed(2)}`,
      badge: product.heroBadge ?? undefined
    }));
  } catch (error) {
    console.error("Failed to load highlighted products", error);
    return [];
  }
}

export default async function HomePage() {
  const highlightedProducts = await getHighlightedProducts();

  return (
    <div className="space-y-10 pb-20">
      <HeroClassic {...homeHeroContent} />

      <FeaturedCollections />

      <ProductCollectionGrid
        title="Featured products"
        description="Live menu pulled directly from Strapi so members can see what's ready right now."
        products={highlightedProducts}
        primaryCta={{ label: "View full menu", href: "/products" }}
      />

      <div id="lockers">
        <HowItWorksLocker />
      </div>

      <PaymentRecommendation />
    </div>
  );
}

function FeaturedCollections() {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featuredCollectionsContent.map((collection) => (
        <Link
          key={collection.title}
          href={collection.href}
          className="group relative flex h-56 items-end overflow-hidden rounded-[32px] text-white shadow-[0_25px_70px_rgba(0,0,0,0.35)] transition hover:-translate-y-1"
          style={{ backgroundImage: `linear-gradient(135deg, ${collection.bgGradient})` }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
              backgroundSize: "24px 24px"
            }}
          />
          <div className="absolute inset-x-4 top-0 h-24 rounded-b-[40%] bg-white/30 blur-[90px] opacity-70" />
          <Image
            src={collection.imageUrl}
            alt={collection.title}
            fill
            sizes="(min-width: 1024px) 28vw, 80vw"
            className="object-contain opacity-90"
          />
          <div className="relative z-10 w-full px-5 pb-5 text-left">
            {collection.tagline && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80 drop-shadow">{collection.tagline}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-2xl font-semibold uppercase tracking-[0.2em] drop-shadow">
              {collection.title}
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white transition group-hover:translate-x-1 group-hover:-translate-y-1">
                <ArrowIcon />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}
