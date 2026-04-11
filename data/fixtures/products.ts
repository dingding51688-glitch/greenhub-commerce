export type ProductCategoryKey = "shop-all" | "flowers" | "pre-rolls" | "vapes" | "edibles" | "concentrates";

export type ProductCategoryContent = {
  breadcrumb: string;
  title: string;
  description: string;
  helper?: string;
  filter?: { param: string; value: string };
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
    filter: { param: "filters[collection][slug][$eqi]", value: "flower" }
  },
  "pre-rolls": {
    breadcrumb: "HOME / SHOP ALL / PRE-ROLLS",
    title: "Hand-twisted joints, ready for pickup",
    description: "Infused one-gram pre-rolls with glass tips and terpene boosts. Perfect for quick grab-and-go pickups.",
    filter: { param: "filters[collection][slug][$eqi]", value: "pre-rolls" }
  },
  vapes: {
    breadcrumb: "HOME / SHOP ALL / VAPES",
    title: "Full-ceramic carts & pods",
    description: "Live resin and distillate carts with heavy metal testing on file. Works with Bloom pods or 510 batteries.",
    filter: { param: "filters[collection][slug][$eqi]", value: "vapes" }
  },
  edibles: {
    breadcrumb: "HOME / SHOP ALL / EDIBLES",
    title: "Gummies, chocolates & more",
    description: "Lab-tested edibles with precise dosing. From fruity gummies to rich chocolates — discreet and delicious.",
    filter: { param: "filters[collection][slug][$eqi]", value: "edibles" }
  },
  concentrates: {
    breadcrumb: "HOME / SHOP ALL / CONCENTRATES",
    title: "Wax, shatter & live resin",
    description: "Solvent and solventless concentrates for dab rigs and pens. Lab-tested potency with full terpene profiles.",
    filter: { param: "filters[collection][slug][$eqi]", value: "concentrates" }
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
  "berry-kush": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_1763924030.png",
    imageAlt: "Berry Kush flower",
    origin: "🇬🇧 Locker verified",
    rating: 4.9,
    reviews: 182,
    potencyBadge: "Medium"
  },
  "midnight-gelato": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_d66c882407.png",
    imageAlt: "Midnight Gelato flower",
    origin: "🇬🇧 Locker verified",
    rating: 4.8,
    reviews: 96,
    potencyBadge: "Medium"
  },
  "berry-kush-3-5g": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_1763924030.png",
    imageAlt: "Berry Kush 3.5g pre-roll",
    origin: "🇬🇧 Locker verified",
    rating: 4.7,
    reviews: 54,
    potencyBadge: "Medium"
  },
  "midnight-gelato-7g": {
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_d66c882407.png",
    imageAlt: "Midnight Gelato 7g jar",
    origin: "🇬🇧 Locker verified",
    rating: 4.8,
    reviews: 61,
    potencyBadge: "Medium"
  }
};

export function getProductListingMeta(slug: string) {
  return productListingMeta[slug];
}
