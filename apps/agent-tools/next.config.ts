import type { NextConfig } from "next";
import { mergedRedirects } from "./src/lib/merged";

const nextConfig: NextConfig = {
  // No longer need outputFileTracingIncludes — using Turso remote DB
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/seo"],
  async redirects() {
    return mergedRedirects();
  },
};

export default nextConfig;
