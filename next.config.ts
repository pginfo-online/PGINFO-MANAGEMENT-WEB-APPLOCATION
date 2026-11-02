import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:3000/api/v1/:path*",
      },
      {
        source: "/health/:path*",
        destination: "http://localhost:3000/health/:path*",
      },
    ];
  },
};

export default nextConfig;
