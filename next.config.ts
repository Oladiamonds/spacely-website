import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization — allow Cloudinary and Supabase Storage CDN domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Aggressive caching for space listing images
    minimumCacheTTL: 86400, // 24 hours
  },

  // Security headers — required per security audit spec
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://api.paystack.co https://api.cloudinary.com https://maps.googleapis.com https://api.prembly.com https://api.termii.com",
              "frame-src https://js.paystack.co",
              "media-src 'self' https://res.cloudinary.com",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirect bare /spaces to /spaces/lagos as default city
  async redirects() {
    return [
      {
        source: "/spaces",
        destination: "/spaces/lagos",
        permanent: false,
      },
    ];
  },

  // Experimental features for Next.js 15 performance
  experimental: {
    // Partial Prerendering for space listing pages (instant shell + streamed content)
    ppr: true,
    // React compiler for automatic memoization
    reactCompiler: false,
  },
};

export default nextConfig;
