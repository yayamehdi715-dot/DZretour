// 📁 EMPLACEMENT : app/api/sitemap/route.tsx  (remplace l'existant)
// Note : Next.js 14 génère aussi /sitemap.xml depuis app/sitemap.ts
// Cette route API reste en backup pour la compatibilité avec le rewrite
import { NextResponse } from "next/server"

export const dynamic = "force-static"
export const revalidate = 86400 // Re-génère toutes les 24h

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"
  const now = new Date().toISOString().split("T")[0] // Format YYYY-MM-DD

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}"/>
    <image:image>
      <image:loc>${baseUrl}/image.png</image:loc>
      <image:title>DzRetour — Protection des marchands algériens</image:title>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/check</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/check"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/check"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/check"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/check"/>
  </url>

  <url>
    <loc>${baseUrl}/report</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/report"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/report"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/report"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/report"/>
  </url>

  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  })
}