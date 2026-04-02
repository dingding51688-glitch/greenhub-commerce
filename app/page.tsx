import { HeroClassic, ProductCategoryCard } from "@/components/sections";
import { featuredCollectionsContent, homeHeroContent } from "@/data/fixtures/marketing";

export default function HomePage() {
  return (
    <div className="space-y-10 pb-20">
      <HeroClassic {...homeHeroContent} />
      <FeaturedCollections />
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
