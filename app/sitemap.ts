import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const langs = { ar: "", fr: "", en: "" }

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          Object.keys(langs).map(l => [l, SITE_URL])
        ),
      },
    },
    {
      url: `${SITE_URL}/check`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          Object.keys(langs).map(l => [l, `${SITE_URL}/check`])
        ),
      },
    },
    {
      url: `${SITE_URL}/report`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          Object.keys(langs).map(l => [l, `${SITE_URL}/report`])
        ),
      },
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
