/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.greenhub420.co.uk"
      }
    ]
  }
};

export default nextConfig;
