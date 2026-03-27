import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include db files in the serverless function output
  outputFileTracingIncludes: {
    "/*": ["./db/**/*"],
  },
};

export default nextConfig;
