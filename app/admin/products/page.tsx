import { serverFetch } from "@/lib/server-api";
import type { StrapiMedia } from "@/lib/types";
import Link from "next/link";
import { ProductListClient } from "./product-list-client";

type ProductListItem = {
  id: number;
  title: string;
  slug: string;
  priceFrom: number;
  inStock: boolean;
  strain?: string;
  featuredImage?: { id: number; url: string } | null;
  weightOptions?: Array<{ label: string; price: number }>;
};

async function fetchProducts(): Promise<ProductListItem[]> {
  try {
    const res = await serverFetch<{
      data: Array<{
        id: number;
        // Strapi 5 flat format
        title: string;
        slug: string;
        priceFrom: number;
        inStock?: boolean;
        strain?: string;
        featuredImage?: { id: number; url: string; name?: string } | null;
        weightOptions?: Array<{ label: string; price: number }>;
        // Strapi 4 nested format fallback
        attributes?: {
          title: string;
          slug: string;
          priceFrom: number;
          inStock?: boolean;
          strain?: string;
          featuredImage?: { data: StrapiMedia | null };
          weightOptions?: Array<{ label: string; price: number }>;
        };
      }>;
    }>("/api/products?populate=featuredImage,weightOptions&sort=title&pagination[pageSize]=100");

    return res.data.map((p) => {
      // Strapi 5 flat format
      if (p.title) {
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          priceFrom: p.priceFrom,
          inStock: p.inStock !== false,
          strain: p.strain,
          featuredImage: p.featuredImage
            ? { id: p.featuredImage.id, url: p.featuredImage.url }
            : null,
          weightOptions: p.weightOptions,
        };
      }
      // Strapi 4 nested format
      const a = p.attributes!;
      return {
        id: p.id,
        title: a.title,
        slug: a.slug,
        priceFrom: a.priceFrom,
        inStock: a.inStock !== false,
        strain: a.strain,
        featuredImage: a.featuredImage?.data
          ? { id: a.featuredImage.data.id, url: a.featuredImage.data.attributes.url }
          : null,
        weightOptions: a.weightOptions,
      };
    });
  } catch (error) {
    console.error("Failed to fetch products", error);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await fetchProducts();

  return (
    <section className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">商品管理</h1>
          <p className="text-sm text-white/40">Products · {products.length} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400"
        >
          + 上架新商品
        </Link>
      </div>

      <ProductListClient initialProducts={products} />
    </section>
  );
}
