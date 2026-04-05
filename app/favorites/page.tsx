"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/components/providers/AuthProvider";
import type { FavoriteProduct, ProductRecord } from "@/lib/types";

export default function FavoritesPage() {
  const { token, favorites } = useAuth();
  const router = useRouter();

  if (!token) {
    return (
      <StateMessage
        title="Sign in to view favorites"
        body="Create an account to save your favourite products."
        actionLabel="Go to register"
        onAction={() => router.push("/register")}
      />
    );
  }

  const sorted = [...favorites].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-night-950/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Favorites</p>
        <h1 className="text-3xl font-semibold text-white">Saved products</h1>
        <p className="mt-2 text-sm text-white/60">Save strains you want to pick up later — we’ll sync them across devices.</p>
      </header>

      {sorted.length === 0 ? (
        <StateMessage
          variant="empty"
          title="No favorites yet"
          body="Tap the heart on any product to build your shortlist."
          actionLabel="Browse products"
          onAction={() => router.push("/products")}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((favorite) => {
            const product = favoriteToProductRecord(favorite);
            return (
              <div key={favorite.productId} className="space-y-3 rounded-[32px] border border-white/10 bg-night-950/70 p-4">
                <ProductCard product={product} variant="list" />
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/checkout?product=${product.slug}`}>Add to cart</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/products/${product.slug}`}>View details</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function favoriteToProductRecord(favorite: FavoriteProduct): ProductRecord {
  return {
    id: favorite.productId,
    documentId: favorite.slug,
    title: favorite.title,
    slug: favorite.slug,
    description: favorite.description ?? "",
    heroBadge: null,
    priceFrom: favorite.priceFrom ?? 0,
    strain: favorite.strain ?? "Hybrid",
    thc: favorite.thc ?? undefined,
    potency: favorite.potency ?? undefined,
    rating: null,
    reviews: null,
    category: undefined,
    coverImage: favorite.coverImage ?? null,
    weightOptions: []
  } as ProductRecord;
}
