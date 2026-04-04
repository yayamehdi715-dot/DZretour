// 📁 EMPLACEMENT : app/check/layout.tsx  (nouveau fichier à créer)
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export const metadata: Metadata = {
  title: "Vérifier un numéro de client — DzRetour",
  description:
    "Vérifiez si un numéro de téléphone algérien appartient à un retourneur connu avant d'expédier votre colis. Service gratuit et instantané.",
  keywords: [
    "vérifier numéro algérie", "tester client retourneur", "تحقق من رقم هاتف جزائر",
    "contrôle client algérie", "numéro suspect algérie", "check number algeria",
    "vérification retourneur", "numéro rotour algérie",
  ],
  alternates: {
    canonical: `${SITE_URL}/check`,
    languages: {
      "ar": `${SITE_URL}/check`,
      "fr": `${SITE_URL}/check`,
      "en": `${SITE_URL}/check`,
    },
  },
  openGraph: {
    url: `${SITE_URL}/check`,
    title: "Vérifier un numéro de client — DzRetour",
    description: "Vérifiez si un numéro est signalé comme retourneur avant d'expédier. Gratuit et instantané.",
    images: [{ url: "/image.png", width: 1200, height: 630, alt: "DzRetour — Vérification" }],
  },
}

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}