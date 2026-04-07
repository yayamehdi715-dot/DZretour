/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression gzip/brotli automatique
  compress: true,

  // Supprime le header "X-Powered-By: Next.js" (ne pas exposer le stack)
  poweredByHeader: false,

  // Active les ETags pour la mise en cache navigateur
  generateEtags: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  async headers() {
    // Content Security Policy
    // - unsafe-inline requis par Next.js hydration + Tailwind inline styles
    // - unsafe-eval requis par Next.js en production (dynamic chunk loading)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://ipapi.co https://analyticsdata.googleapis.com https://oauth2.googleapis.com https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ")

    return [
      {
        // Sécurité globale — appliquée à toutes les routes
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",        value: csp },
          { key: "X-Frame-Options",                value: "DENY" },
          { key: "X-Content-Type-Options",         value: "nosniff" },
          { key: "Strict-Transport-Security",      value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Referrer-Policy",                value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",             value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy",     value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy",   value: "require-corp" },
        ],
      },
      {
        // Cache long pour les assets statiques Next.js (JS/CSS/fonts)
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache court pour les images publiques
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
      {
        // Pas de cache pour les API — pas d'informations sensibles en cache
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control",      value: "no-store, no-cache, must-revalidate, private" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Pragma",             value: "no-cache" },
        ],
      },
      {
        // Admin — pas d'indexation, pas de cache
        source: "/admin(.*)",
        headers: [
          { key: "X-Robots-Tag",   value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control",  value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma",         value: "no-cache" },
        ],
      },
    ]
  },
}

export default nextConfig
