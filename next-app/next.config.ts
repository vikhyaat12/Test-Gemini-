import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' https://images.unsplash.com data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://player.vimeo.com" },
      { key: "Accept-Ranges", value: "bytes" },
    ] }];
  },
  async redirects() {
    return [
      { source: "/employees", destination: "/employee", permanent: true },
      { source: "/our-team", destination: "/employee", permanent: true },
      { source: "/team", destination: "/employee", permanent: true },
      { source: "/partners", destination: "/b2b", permanent: true },
      { source: "/partner", destination: "/b2b", permanent: true },
      { source: "/distributor", destination: "/store-locator", permanent: true },
      { source: "/distributors", destination: "/store-locator", permanent: true },
      { source: "/locator", destination: "/store-locator", permanent: true },
    ];
  },
};

export default nextConfig;