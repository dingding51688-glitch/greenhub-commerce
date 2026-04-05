import { HeroClassic, HowItWorksStore, PaymentRecommendation, ProductCategoryCard, ProductCollectionGrid } from "@/components/sections";
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

const storeJourneyContent = {
  eyebrow: "Online store",
  title: "How the online store works",
  steps: [
    { icon: "①", title: "Reserve online", description: "Browse the catalog, add what you need to cart, and confirm checkout with wallet or card." },
    { icon: "②", title: "We prep & dispatch", description: "Support verifies payment, seals packaging, and texts you tracking + pickup instructions." },
    { icon: "③", title: "Collect or receive", description: "Head to the pickup point or accept the courier hand-off, then reply DONE so we can reset the slot." }
  ],
  tip: {
    label: "Service coverage",
    content: "Belfast & Derry orders dispatch same-evening; other NI postcodes leave our hub by 10:00 the next morning."
  }
};

export default async function HomePage() {
  const highlightedProducts = await getHighlightedProducts();

  return (
    <div className="space-y-10 pb-20">
      <HeroClassic {...homeHeroContent} />

      <FeaturedCollections />

      <ProductCollectionGrid
        title="Featured products"
        description="Real-time catalog pulled from Strapi so you always see what's ready to dispatch."
        products={highlightedProducts}
        primaryCta={{ label: "Browse product catalog", href: "/products" }}
      />

      <div id="store-journey">
        <HowItWorksStore {...storeJourneyContent} />
      </div>

      <PaymentRecommendation />
    </div>
  );
}

function FeaturedCollections() {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featuredCollectionsContent.map((collection) => (
        <ProductCategoryCard key={collection.title} {...collection} />
      ))}
    </section>
  );
}
