import type { MetadataRoute } from "next";

const BASE = "https://www.greenhub420.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    { url: BASE, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${BASE}/products`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/shipping`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/faq`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE}/returns`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/register`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE}/login`, changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const strapiUrl = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
    const res = await fetch(`${strapiUrl}/api/products?pagination[pageSize]=100&fields[0]=slug&fields[1]=updatedAt`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    productPages = (data.data ?? []).map((p: any) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    // Fallback: no product pages in sitemap
  }

  return [...staticPages, ...productPages];
}
