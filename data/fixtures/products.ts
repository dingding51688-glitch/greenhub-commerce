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
    title: "Store menu for every palette",
    description: "Scroll through every strain, pre-roll, and cart in a single feed. Use the tabs to jump into a category or keep filters on \"All\" to see everything.",
    helper: "Filters update the catalog instantly."
  },
  flowers: {
    breadcrumb: "HOME / SHOP ALL / FLOWERS",
    title: "Fresh flower jars, trimmed this week",
    description: "Hybrid, indica, and sativa cultivars sealed in nitrogen jars. Always harvested within 14 days and held at 59% humidity.",
    filter: { field: "category", value: "flowers" }
  },
  "pre-rolls": {
    breadcrumb: "HOME / SHOP ALL / PRE-ROLLS",
    title: "Hand-twisted joints, ready for pickup",
    description: "Infused one-gram pre-rolls with glass tips and terpene boosts. Perfect for quick grab-and-go pickups.",
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
    origin: "🇬🇧 NI support team",
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

export function getProductListingMeta(slug: string) {
  return productListingMeta[slug];
}
