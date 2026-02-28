import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @react-pdf/renderer in API routes (Node-specific APIs, not bundleable)
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
