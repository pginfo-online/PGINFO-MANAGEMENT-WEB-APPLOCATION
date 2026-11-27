import type { NextConfig } from "next";

const defaultBackendOrigin =
  process.env.NODE_ENV === "production"
    ? "https://app.pginfo.business"
    : "http://127.0.0.1:3009";
const backendOrigin = (
  process.env.PGINFO_BACKEND_ORIGIN ?? defaultBackendOrigin
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${backendOrigin}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
