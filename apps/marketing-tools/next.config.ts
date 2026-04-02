import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No longer need outputFileTracingIncludes — using Turso remote DB
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/seo"],
};

export default nextConfig;
