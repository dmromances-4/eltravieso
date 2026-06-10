import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

let supabaseHost = "*.supabase.co";
try {
  if (process.env.SUPABASE_URL) {
    supabaseHost = new URL(process.env.SUPABASE_URL).host;
  }
} catch {
  // keep default
}

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost} https://www.theworlds50best.com https://theworlds50best.com https://image.tmdb.org https://www.decantalo.com https://www.bodeboca.com https://www.vilaviniteca.es https://lafuente.es`,
  "font-src 'self' data:",
  `connect-src 'self' https://api.stripe.com https://${supabaseHost} ${wsUrl} https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://api.themoviedb.org`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com https://embed.podcasts.apple.com https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.theworlds50best.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "theworlds50best.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.decantalo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.bodeboca.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.vilaviniteca.es",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lafuente.es",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      ...(supabaseHost !== "*.supabase.co"
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/**" }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
