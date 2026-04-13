const unoptimizedImages = process.env.NEXT_IMAGE_UNOPTIMIZED === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide X-Powered-By: Next.js header
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Hide server info
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  images: {
    unoptimized: unoptimizedImages,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.greenhub420.co.uk"
      },
      {
        protocol: "https",
        hostname: "cdn.greenhub420.co.uk"
      }
    ]
  }
};

export default nextConfig;
