import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "clsx", "jose"],
  },
  compress: true,
  reactStrictMode: false,
};

export default nextConfig;
