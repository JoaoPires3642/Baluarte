import type { NextConfig } from "next";
import { withAxiomNextConfig } from "next-axiom";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://t3.storageapi.dev https://images.unsplash.com https://assets.football-logos.cc https://acdn-us.mitiendanube.com https://*.mitiendanube.com https://imgnike-a.akamaihd.net https://*.akamaihd.net https://m.media-amazon.com https://*.media-amazon.com https://photo.yupoo.com https://*.yupoo.com https://static.netshoes.com.br https://*.netshoes.com.br https://http2.mlstatic.com https://*.mlstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.mercadopago.com https://viacep.com.br https://api.axiom.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "t3.storageapi.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.football-logos.cc" },
      { protocol: "https", hostname: "**.mitiendanube.com" },
      { protocol: "https", hostname: "**.akamaihd.net" },
      { protocol: "https", hostname: "**.media-amazon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "**.yupoo.com" },
      { protocol: "https", hostname: "**.netshoes.com.br" },
      { protocol: "https", hostname: "**.mlstatic.com" },
    ],
  },
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default withAxiomNextConfig(nextConfig);
