import type { ProductRecord, ProductImage, WeightOption } from "@/lib/types";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export type ProductSearchParams = {
  q?: string;
  category?: string;
  strain?: string;
  potency?: string;
  thc?: string;
};

export async function searchProducts(params: ProductSearchParams = {}): Promise<ProductRecord[]> {
  if (!AUTH_BASE) {
    return [];
  }

  const url = new URL(`${AUTH_BASE}/api/products`);
  url.searchParams.set("populate[0]", "weightOptions");
  url.searchParams.set("populate[1]", "featuredImage");
  url.searchParams.set("populate[2]", "gallery");
  url.searchParams.set("pagination[pageSize]", "12");

  if (params.q) {
    url.searchParams.set("filters[$or][0][title][$containsi]", params.q);
    url.searchParams.set("filters[$or][1][description][$containsi]", params.q);
  }
  if (params.category) {
    url.searchParams.set("filters[category][$eqi]", params.category);
  }
  if (params.strain) {
    url.searchParams.set("filters[strain][$eqi]", params.strain);
  }
  if (params.potency) {
    url.searchParams.set("filters[potency][$eqi]", params.potency);
  }
  if (params.thc) {
    url.searchParams.set("filters[thc][$containsi]", params.thc);
  }

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json().catch(() => ({}));
  const entries = Array.isArray(payload?.data) ? payload.data : [];
  if (!entries.length) {
    return [];
  }
  return entries.map(mapProductRecord);
}

function mapProductRecord(entry: any): ProductRecord {
  const attributes = entry?.attributes ?? {};
  const coverImage = extractImage(attributes.coverImage);
  const weightOptions = Array.isArray(attributes.weightOptions)
    ? (attributes.weightOptions as WeightOption[])
    : [];
  return {
    id: entry?.id ?? 0,
    documentId: attributes.documentId || String(entry?.id ?? "product"),
    title: attributes.title || "Locker product",
    slug: attributes.slug || attributes.documentId || String(entry?.id ?? "product"),
    description: attributes.description || "",
    heroBadge: attributes.heroBadge || null,
    priceFrom: attributes.priceFrom || 0,
    strain: attributes.strain || "Hybrid",
    thc: attributes.thc || null,
    potency: attributes.potency || null,
    rating: attributes.rating || null,
    reviews: attributes.reviews || null,
    category: attributes.category || null,
    coverImage,
    weightOptions
  } as ProductRecord;
}

function extractImage(value: any): ProductImage | null {
  const data = value?.data;
  if (!data?.attributes?.url) return null;
  return {
    url: data.attributes.url,
    alternativeText: data.attributes.alternativeText ?? null
  };
}
