import type { ProductRecord } from "@/lib/types";

export type ProductCategoryKey = "shop-all" | "flowers" | "pre-rolls" | "vapes";

export type ProductCategoryContent = {
  breadcrumb: string;
  title: string;
  description: string;
  helper?: string;
  filter?: { field: string; value: string };
};

export const productCategoryContent: Record<ProductCategoryKey, ProductCategoryContent> = {
  "shop-all": {
    breadcrumb: "HOME / SHOP ALL",
    title: "Locker-ready menu for every palette",
    description: "Scroll through every strain, pre-roll, and cart in a single feed. Use the tabs to jump into a category or keep filters on \"All\" to see everything.",
    helper: "Filters update the locker feed instantly."
  },
  flowers: {
    breadcrumb: "HOME / SHOP ALL / FLOWERS",
    title: "Fresh flower jars, trimmed this week",
    description: "Hybrid, indica, and sativa cultivars sealed in nitrogen jars. Always harvested within 14 days and held at 59% humidity.",
    filter: { field: "category", value: "flowers" }
  },
  "pre-rolls": {
    breadcrumb: "HOME / SHOP ALL / PRE-ROLLS",
    title: "Hand-twisted joints, ready for the locker",
    description: "Infused one-gram pre-rolls with glass tips and terpene boosts. Perfect for quick locker pickups.",
    filter: { field: "category", value: "pre-rolls" }
  },
  vapes: {
    breadcrumb: "HOME / SHOP ALL / VAPES",
    title: "Full-ceramic carts & pods",
    description: "Live resin and distillate carts with heavy metal testing on file. Works with Bloom pods or 510 batteries.",
    filter: { field: "category", value: "vapes" }
  }
};

export type ProductCardMeta = {
  imageUrl?: string;
  imageAlt?: string;
  origin?: string;
  rating?: number;
  reviews?: number;
  potencyBadge?: string;
};

export const productListingMeta: Record<string, ProductCardMeta> = {
  "cereal-milk": {
    imageUrl: "/images/products/cereal-milk.jpg",
    imageAlt: "Cereal Milk flower",
    origin: "🇬🇧 Belfast lab",
    rating: 4.9,
    reviews: 182,
    potencyBadge: "Strong"
  },
  "midnight-gelato": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/midnight_gelato_c69a6bb9c4.jpg",
    imageAlt: "Midnight Gelato pre-rolls",
    origin: "🇪🇺 EU craft",
    rating: 4.8,
    reviews: 96,
    potencyBadge: "Medium"
  },
  "rose-spliff": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/rose_spliff_0670cb8d92.jpg",
    imageAlt: "Rose petal joints",
    origin: "🇬🇧 NI concierge",
    rating: 4.7,
    reviews: 76,
    potencyBadge: "Medium"
  },
  "cuban-z-vape": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/cuban_z_vape_aaff226934.jpg",
    imageAlt: "Cuban Z live resin cart",
    origin: "🇺🇸 CA extract",
    rating: 4.9,
    reviews: 143,
    potencyBadge: "High"
  }
};

export const productListingFallbacks: ProductRecord[] = [
  {
    id: 9001,
    documentId: "mock-cereal-milk",
    title: "Cereal Milk",
    slug: "cereal-milk",
    description: "Cream-heavy hybrid with frosted buds, cured 14 days and flushed with nitrogen before dispatch.",
    heroBadge: "Locker-ready",
    priceFrom: 45,
    strain: "Hybrid",
    thc: "23% THC",
    potency: "Strong",
    rating: 4.9,
    reviews: 182,
    category: "flowers",
    weightOptions: [
      { id: 1, label: "3.5g jar", price: 45, unitPrice: "£45 / 3.5g", featured: true },
      { id: 2, label: "7g jar", price: 80, unitPrice: "£80 / 7g" }
    ]
  },
  {
    id: 9002,
    documentId: "mock-midnight-gelato",
    title: "Midnight Gelato",
    slug: "midnight-gelato",
    description: "Velvety indica-leaning pre-roll pack with glass tips and ice-water hash infusion.",
    heroBadge: "Infused",
    priceFrom: 38,
    strain: "Indica",
    thc: "27% THC",
    potency: "Medium",
    rating: 4.8,
    reviews: 96,
    category: "pre-rolls",
    weightOptions: [
      { id: 3, label: "Pack of 3", price: 38, unitPrice: "£12.60 / roll", featured: true },
      { id: 4, label: "Pack of 6", price: 70, unitPrice: "£11.60 / roll" }
    ]
  },
  {
    id: 9003,
    documentId: "mock-rose-spliff",
    title: "Rose Spliff",
    slug: "rose-spliff",
    description: "Hand-rolled rose petal joints, terpene boosted with strawberry live resin.",
    heroBadge: "Limited",
    priceFrom: 32,
    strain: "Hybrid",
    thc: "24% THC",
    potency: "Medium",
    rating: 4.7,
    reviews: 76,
    category: "pre-rolls",
    weightOptions: [
      { id: 5, label: "Twin pack", price: 32, unitPrice: "£16 / roll", featured: true }
    ]
  },
  {
    id: 9004,
    documentId: "mock-cuban-z-vape",
    title: "Cuban Z Live Resin",
    slug: "cuban-z-vape",
    description: "One-gram ceramic cart with Cuban Z terps, heavy limonene + fuel finish.",
    heroBadge: "Live resin",
    priceFrom: 48,
    strain: "Sativa",
    thc: "86% THC",
    potency: "High",
    rating: 4.9,
    reviews: 143,
    category: "vapes",
    weightOptions: [
      { id: 6, label: "1g cart", price: 48, unitPrice: "£48 / 1g", featured: true }
    ]
  }
];

export function getProductListingMeta(slug: string) {
  return productListingMeta[slug];
}
