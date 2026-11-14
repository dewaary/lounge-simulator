import type { NextConfig } from "next";

// Static export: the prototype can be hosted on any static host
// (Hostinger subdomain, Vercel, or an artifact page).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
