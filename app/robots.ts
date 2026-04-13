import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block traffic analysis crawlers
      { userAgent: "SimilarWebBot", disallow: "/" },
      { userAgent: "SemrushBot", disallow: "/" },
      { userAgent: "AhrefsBot", disallow: "/" },
      { userAgent: "MJ12bot", disallow: "/" },
      { userAgent: "DotBot", disallow: "/" },
      { userAgent: "SerpstatBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "PetalBot", disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/wallet/", "/cart/", "/checkout/", "/orders/", "/notifications/", "/dashboard/"],
      },
    ],
    sitemap: "https://www.greenhub420.co.uk/sitemap.xml",
  };
}
