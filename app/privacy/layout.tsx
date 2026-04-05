import type { Metadata } from "next"
import type React from "react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export const metadata: Metadata = {
  title: "Politique de confidentialité — DzRetour",
  description:
    "Politique de confidentialité de DzRetour : comment nous collectons, utilisons et protégeons vos données personnelles conformément à la loi algérienne sur la protection des données (loi 18-07).",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
    languages: {
      ar: `${SITE_URL}/privacy`,
      fr: `${SITE_URL}/privacy`,
      en: `${SITE_URL}/privacy`,
    },
  },
  openGraph: {
    url: `${SITE_URL}/privacy`,
    title: "Politique de confidentialité — DzRetour",
    description: "Vos données sont protégées. Découvrez comment DzRetour gère la confidentialité de vos informations.",
    images: [{ url: "/image.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
