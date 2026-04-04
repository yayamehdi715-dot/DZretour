// 📁 EMPLACEMENT : app/report/layout.tsx  (nouveau fichier à créer)
// Ce layout server component permet d'avoir des metadata statiques
// sur une page "use client" — c'est le pattern recommandé Next.js 14
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export const metadata: Metadata = {
  title: "Signaler un retourneur — DzRetour",
  description:
    "Signalez un retourneur en Algérie en quelques secondes. Entrez le numéro de téléphone et aidez les autres marchands à se protéger. Service gratuit.",
  keywords: [
    "signaler retourneur algérie", "signalement rotour", "روتور الجزائر إبلاغ",
    "protection marchand algérie", "signaler numéro algérie", "retour abusif algérie",
  ],
  alternates: {
    canonical: `${SITE_URL}/report`,
    languages: {
      "ar": `${SITE_URL}/report`,
      "fr": `${SITE_URL}/report`,
      "en": `${SITE_URL}/report`,
    },
  },
  openGraph: {
    url: `${SITE_URL}/report`,
    title: "Signaler un retourneur — DzRetour",
    description: "Signalez un retourneur en quelques secondes. Aidez la communauté des marchands algériens.",
    images: [{ url: "/image.png", width: 1200, height: 630, alt: "DzRetour — Signalement" }],
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}