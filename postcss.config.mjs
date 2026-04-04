// 📁 EMPLACEMENT : next.config.mjs  (remplace l'existant à la racine)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression gzip/brotli automatique
  compress: true,

  // Supprime le header "X-Powered-By: Next.js" (sécurité + légèreté)
  poweredByHeader: false,

  // Active les ETags pour la mise en cache navigateur
  generateEtags: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  // Image optimization activée (WebP automatique, lazy loading, redimensionnement)
  // "unoptimized: true" était une erreur — on la supprime
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
    ]
  },

  async headers() {
    return [
      {
        // Sécurité globale
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Cache long pour les assets statiques (JS/CSS/fonts/images)
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
        // Pas de cache pour les routes API
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ]
  },
}

export default nextConfig
