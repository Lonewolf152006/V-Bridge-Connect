import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "xlsx"],
  },
  compress: true,
  reactStrictMode: false,
};

export default nextConfig;
