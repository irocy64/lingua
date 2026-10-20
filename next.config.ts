import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立部署产物（用于 Docker，体积小）
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
