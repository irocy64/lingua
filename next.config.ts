import type { NextConfig } from "next";

// Netlify 使用 OpenNext 适配器，不需要 standalone 产物；Docker 自托管仍保留 standalone。
const isNetlify = process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  ...(isNetlify ? {} : { output: "standalone" }),
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
