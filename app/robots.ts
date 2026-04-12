import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/wallet/", "/cart/", "/checkout/", "/orders/", "/notifications/", "/dashboard/"],
      },
    ],
    sitemap: "https://www.greenhub420.co.uk/sitemap.xml",
  };
}
