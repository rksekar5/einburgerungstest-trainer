import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile elsewhere on disk can't be
  // mistaken for the project root during build/deploy.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
