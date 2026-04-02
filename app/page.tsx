import { HeroClassic, HowItWorksLocker, ProductCollectionGrid, PaymentRecommendation } from "@/components/sections";
import type { ProductCardData, ProductsResponse } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import { featuredCollectionsContent } from "@/data/fixtures/marketing";

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
      <HeroClassic
        primaryCta={{ label: "Shop lockers", href: "/products" }}
        secondaryCta={{ label: "How lockers work", href: "#lockers" }}
        stats={[
          { label: "Locker pickup", value: "24/7" },
          { label: "Members served", value: "3.1k" },
          { label: "Avg. rating", value: "4.9/5" }
        ]}
      />

      <FeaturedCollections />

      <ProductCollectionGrid
        title="Tonight&apos;s locker picks"
        description="Live menu pulled directly from Strapi so members can see what&apos;s ready right now."
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
    <section className="grid gap-4 md:grid-cols-3">
      {featuredCollectionsContent.map((collection) => (
        <article
          key={collection.title}
          className={`rounded-3xl border border-white/5 bg-gradient-to-r ${collection.accent} p-5 shadow-surface`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-500">Collection</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{collection.title}</h3>
          <p className="mt-3 text-sm text-ink-300">{collection.blurb}</p>
          <a href={collection.href} className="mt-6 inline-flex items-center text-sm font-semibold text-plum-200">
            Explore →
          </a>
        </article>
      ))}
    </section>
  );
}
