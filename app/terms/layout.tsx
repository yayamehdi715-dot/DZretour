import type { Metadata } from "next"
import type React from "react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export const metadata: Metadata = {
  title: "Conditions d'utilisation — DzRetour",
  description:
    "Conditions générales d'utilisation de DzRetour, la plateforme communautaire de protection des marchands algériens contre les retourneurs abusifs.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
    languages: {
      ar: `${SITE_URL}/terms`,
      fr: `${SITE_URL}/terms`,
      en: `${SITE_URL}/terms`,
    },
  },
  openGraph: {
    url: `${SITE_URL}/terms`,
    title: "Conditions d'utilisation — DzRetour",
    description: "Lisez les conditions d'utilisation de DzRetour avant d'utiliser nos services.",
    images: [{ url: "/image.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
