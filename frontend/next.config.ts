import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for dynamic routes - they'll be handled client-side
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
