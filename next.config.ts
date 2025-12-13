import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${'http://0.0.0.0:8080'}/:path*`, // || process.env.BACKEND_URL || 'http://localhost:8080'
      },
    ];
  }
};

export default nextConfig;
