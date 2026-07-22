import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.transparenttextures.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
