import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const LIVE_ORIGIN = "https://www.manhaironline.com";

const nextConfig: NextConfig = {
  trailingSlash: true,
  serverExternalPackages: [
    "pg",
    "@payloadcms/db-vercel-postgres",
    "@neondatabase/serverless",
    "@vercel/postgres",
  ],
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.manhaironline.com",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "manhaironline.com",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/wp-content/:path*",
          destination: `${LIVE_ORIGIN}/wp-content/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "manhaironline.com" }],
        destination: `${LIVE_ORIGIN}/`,
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "manhaironline.com" }],
        destination: `${LIVE_ORIGIN}/:path*`,
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "host", value: "(?<host>.+)\\.vercel\\.app" }],
        destination: `${LIVE_ORIGIN}/`,
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.+)\\.vercel\\.app" }],
        destination: `${LIVE_ORIGIN}/:path*`,
        permanent: true,
      },
      { source: "/before-after", destination: "/results/", permanent: true },
      { source: "/about-us", destination: "/about/", permanent: true },
      { source: "/prices", destination: "/", permanent: true },
      { source: "/prices/", destination: "/", permanent: true },
      { source: "/pricing", destination: "/", permanent: true },
      { source: "/pricing/", destination: "/", permanent: true },
      { source: "/landing-page", destination: "/", permanent: true },
      { source: "/landing-page/", destination: "/", permanent: true },
      { source: "/partnerprogram", destination: "/partner-program/", permanent: true },
      { source: "/partnerprogram/", destination: "/partner-program/", permanent: true },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
