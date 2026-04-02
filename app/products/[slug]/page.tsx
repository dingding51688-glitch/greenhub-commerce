import { notFound } from "next/navigation";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import type { ProductRecord, ProductsResponse } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import { ProductDetailPurchase } from "./purchase-panel";

interface ProductPageProps {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const query = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[weightOptions]": "*"
  });
  const data = await serverFetch<ProductsResponse>(`/api/products?${query.toString()}`);
  return data.data?.[0];
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);
  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-4 rounded-3xl border border-white/10 bg-night-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">{product.strain}</p>
        <h1 className="text-4xl font-semibold text-white">{product.title}</h1>
        <p className="text-sm text-ink-400">{product.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-ink-500">
          {product.thc && <span className="rounded-full border border-ink-700 px-3 py-1">{product.thc}</span>}
          {product.potency && <span className="rounded-full border border-ink-700 px-3 py-1">{product.potency}</span>}
          {product.heroBadge && (
            <span className="rounded-full border border-plum-500 px-3 py-1 text-plum-300">{product.heroBadge}</span>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[3fr,2fr]">
        <Card padding="lg" className="bg-night-900/80">
          <h2 className="text-lg font-semibold text-white">What you’ll experience</h2>
          <p className="text-sm text-ink-400">
            Locker-ready flower, hand bottled the morning of delivery. Expect dense buds, terpene-heavy aroma, and discreet packaging that slides into any Bloom locker.
          </p>
          <ul className="mt-4 list-inside list-disc text-sm text-ink-400">
            <li>Sourced from small-batch EU cultivators</li>
            <li>Slow cured 14 days and nitrogen-flushed</li>
            <li>Consumer lab reports available on request</li>
          </ul>
        </Card>
        <ProductDetailPurchase product={product} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-night-900/70 p-5 text-sm text-ink-400">
        <p className="font-semibold text-white">Need specific locker timing?</p>
        <p>Drop a note in checkout and our courier adjusts your slot. Locker pins are valid for 2 hours by default.</p>
        <Button asChild variant="ghost" className="mt-3 w-full sm:w-auto">
          <a href="/checkout">Continue to checkout</a>
        </Button>
      </section>
    </div>
  );
}
