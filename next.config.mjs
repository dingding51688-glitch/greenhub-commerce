const unoptimizedImages = process.env.NEXT_IMAGE_UNOPTIMIZED === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
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
