import { ProductEditor } from "@/components/admin/ProductEditor";
import { serverFetch } from "@/lib/server-api";
import type { AdminProductRecord, CollectionRecord, StrapiListResponse, StrapiMedia, StrapiSingleResponse } from "@/lib/types";
import { notFound } from "next/navigation";

async function fetchCollections() {
  try {
    const response = await serverFetch<StrapiListResponse<CollectionRecord>>(
      "/api/collections?pagination[pageSize]=100&sort=title"
    );
    return response.data.map((entry) => ({ id: entry.id, title: entry.attributes.title }));
  } catch {
    return [];
  }
}

async function fetchProduct(productId: string): Promise<AdminProductRecord | null> {
  try {
    const response = await serverFetch<{ data: Record<string, any> }>(
      `/api/products/${productId}?populate=featuredImage,gallery,weightOptions,collection`
    );

    if (!response.data) return null;
    const d = response.data;

    // Support both Strapi 5 flat and Strapi 4 nested
    const attrs = d.attributes ?? d;

    const mapMediaFlat = (m: any) => {
      if (!m) return null;
      // Strapi 5: { id, url, name }
      if (m.url) return { id: m.id, url: m.url, name: m.name };
      // Strapi 4: { id, attributes: { url, name } }
      if (m.attributes?.url) return { id: m.id, url: m.attributes.url, name: m.attributes.name };
      return null;
    };

    // featuredImage: Strapi 5 flat object or Strapi 4 { data: ... }
    const rawFeatured = attrs.featuredImage?.data ?? attrs.featuredImage;
    const featuredImage = mapMediaFlat(rawFeatured);

    // gallery: Strapi 5 array or Strapi 4 { data: [...] }
    const rawGallery = attrs.gallery?.data ?? attrs.gallery ?? [];
    const gallery = (Array.isArray(rawGallery) ? rawGallery : [])
      .map(mapMediaFlat)
      .filter((a: any): a is NonNullable<typeof a> => Boolean(a));

    // collection: Strapi 5 flat or Strapi 4 { data: { id, attributes } }
    const rawCollection = attrs.collection?.data ?? attrs.collection;
    const collection = rawCollection
      ? { id: rawCollection.id, title: rawCollection.attributes?.title ?? rawCollection.title }
      : null;

    return {
      id: d.id,
      title: attrs.title,
      slug: attrs.slug,
      description: attrs.description,
      heroBadge: attrs.heroBadge,
      priceFrom: attrs.priceFrom,
      strain: attrs.strain,
      thc: attrs.thc,
      potency: attrs.potency,
      origin: attrs.origin,
      originFlag: attrs.originFlag,
      inStock: attrs.inStock,
      weightOptions: attrs.weightOptions,
      featuredImage,
      gallery,
      collection,
    };
  } catch (error) {
    console.error("Failed to load product", error);
    return null;
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, collections] = await Promise.all([fetchProduct(params.id), fetchCollections()]);
  if (!product) {
    notFound();
  }
  return (
    <section className="space-y-6 px-4 py-8">
      <h1 className="text-3xl font-semibold text-white">Edit product</h1>
      <ProductEditor mode="edit" initialProduct={product} collections={collections} />
    </section>
  );
}
