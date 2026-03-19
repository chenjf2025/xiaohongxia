import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
