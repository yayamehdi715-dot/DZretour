// 📁 EMPLACEMENT : app/sitemap.ts  (nouveau fichier à créer)
// Next.js génère automatiquement /sitemap.xml depuis ce fichier
// Plus performant que la route API car rendu statique
import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      // Alternates multilingues
      alternates: {
        languages: {
          ar: SITE_URL,
          fr: SITE_URL,
          en: SITE_URL,
        },
      },
    },
    {
      url: `${SITE_URL}/check`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          ar: `${SITE_URL}/check`,
          fr: `${SITE_URL}/check`,
          en: `${SITE_URL}/check`,
        },
      },
    },
    {
      url: `${SITE_URL}/report`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          ar: `${SITE_URL}/report`,
          fr: `${SITE_URL}/report`,
          en: `${SITE_URL}/report`,
        },
      },
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]
}