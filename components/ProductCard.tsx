import Link from "next/link";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import type { ProductRecord } from "@/lib/types";

interface ProductCardProps {
  product: ProductRecord;
  variant?: "grid" | "list";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const featuredWeight = product.weightOptions?.find((option) => option.featured) || product.weightOptions?.[0];

  return (
    <Card className="flex flex-col gap-4 bg-night-900/70 p-5">
      <div className="flex items-center justify-between text-xs text-ink-400">
        <span className="uppercase tracking-[0.3em] text-ink-500">{product.strain}</span>
        {product.heroBadge && <span className="rounded-full bg-plum-600/20 px-3 py-1 text-plum-300">{product.heroBadge}</span>}
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl text-white">{product.title}</h3>
        <p className="text-sm text-ink-400">{product.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-400">
        {product.thc && <span>{product.thc}</span>}
        {product.potency && <span>• {product.potency}</span>}
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-night-800/80 p-4 text-sm">
        <div className="flex items-center justify-between text-ink-400">
          <span>From</span>
          <span className="font-semibold text-white">£{product.priceFrom.toFixed(2)}</span>
        </div>
        {featuredWeight && (
          <p className="text-xs text-ink-500">
            {featuredWeight.label} — {featuredWeight.unitPrice}
          </p>
        )}
      </div>
      <Button asChild fullWidth={variant === "grid"}>
        <Link href={`/products/${product.slug}`}>View product</Link>
      </Button>
    </Card>
  );
}
