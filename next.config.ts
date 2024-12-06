import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 禁用构建时的 ESLint 检查
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:slug*",
        destination: "http://localhost:8080/:slug*",
      },
    ];
  },
};

export default nextConfig;
