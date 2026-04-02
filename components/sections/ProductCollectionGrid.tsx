import Image from "next/image";
import { Card, Button } from "@/components/ui";
import { featuredProducts } from "@/data/fixtures/marketing";
import type { ProductCardData } from "@/lib/types";

export type ProductCollectionGridProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  products?: ProductCardData[];
  primaryCta?: { label: string; href: string };
};

export function ProductCollectionGrid(props: Partial<ProductCollectionGridProps>) {
  const content = {
    eyebrow: "Now in lockers",
    title: "Member favourites",
    description: "Curated by the Belfast team — rotate in seasonal drops and limited carts.",
    products: featuredProducts,
    primaryCta: { label: "View full menu", href: "/" },
    ...props
  } as ProductCollectionGridProps;

  return (
    <section className="space-y-6 rounded-3xl border border-white/5 bg-night-950/80 p-6 shadow-surface sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {content.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-ink-500">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mt-2 text-3xl font-semibold text-white">{content.title}</h2>
          {content.description && <p className="mt-2 text-ink-400">{content.description}</p>}
        </div>
        {content.primaryCta && (
          <a href={content.primaryCta.href} className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              {content.primaryCta.label}
            </Button>
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.products?.map((product) => (
          <Card key={product.id} padding="sm" className="flex flex-col gap-3">
            {product.badge && (
              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {product.badge}
              </span>
            )}
            {product.imageUrl && (
              <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/5 bg-night-900/40">
                <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-ink-500">{product.category}</p>
              <h3 className="text-lg font-semibold text-white">{product.title}</h3>
              {product.description && <p className="text-sm text-ink-400">{product.description}</p>}
            </div>
            {product.price && <p className="text-base font-semibold text-plum-300">{product.price}</p>}
          </Card>
        ))}
      </div>
    </section>
  );
}

export default ProductCollectionGrid;
