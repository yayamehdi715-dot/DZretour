/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental.appDir n'existe plus dans Next.js 14 — on supprime
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // On active les erreurs TS en build
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Empêche le clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Empêche le MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Force HTTPS pendant 1 an
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Contrôle les infos de referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions API
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Les routes API n'ont pas besoin de cache
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          // Autorise uniquement les requêtes du même domaine (CSRF)
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ]
  },
}

export default nextConfig
