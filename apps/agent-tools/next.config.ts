import type { NextConfig } from "next";
import { mergedRedirects } from "./src/lib/merged";

const nextConfig: NextConfig = {
  // No longer need outputFileTracingIncludes — using Turso remote DB
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/seo"],
  async redirects() {
    return mergedRedirects();
  },
  async rewrites() {
    // Crawlers and some browsers request /favicon.ico directly; serve the generated app icon.
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
