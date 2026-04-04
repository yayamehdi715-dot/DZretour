// 📁 EMPLACEMENT : app/layout.tsx  (remplace l'existant)
import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/contexts/LanguageContext"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: true,
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

// Viewport séparé (requis Next.js 14+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#dc2626",
}

export const metadata: Metadata = {
  // metadataBase est essentiel — sans lui les URLs relatives échouent
  metadataBase: new URL(SITE_URL),

  title: {
    default: "DzRetour — Protégez votre commerce des retourneurs en Algérie",
    template: "%s | DzRetour",
  },
  description:
    "Plateforme communautaire pour les marchands algériens. Vérifiez un numéro de client avant d'expédier et signalez les retourneurs pour protéger votre commerce.",

  keywords: [
    "DzRetour", "retourneur algérie", "rotour algérie", "روتور الجزائر",
    "vérifier numéro algérie", "signaler retour algérie", "protection marchand algérie",
    "colis retour algérie", "تاجر جزائري", "حماية التجارة الجزائر",
    "تحقق من رقم هاتف", "dzretour.com", "commerce algérie", "retour colis dz",
  ],

  authors: [{ name: "DzRetour", url: SITE_URL }],
  creator: "DzRetour",
  publisher: "DzRetour",

  // Contrôle des robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Alternates multilingues — AR + FR + EN
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar": `${SITE_URL}`,
      "fr": `${SITE_URL}`,
      "en": `${SITE_URL}`,
      "x-default": SITE_URL,
    },
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    alternateLocale: ["ar_DZ", "en_US"],
    url: SITE_URL,
    siteName: "DzRetour",
    title: "DzRetour — Protégez votre commerce des retourneurs en Algérie",
    description:
      "Vérifiez les numéros de clients et signalez les retourneurs. Plateforme gratuite pour les marchands algériens.",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "DzRetour — Protection des marchands algériens contre les retourneurs",
        type: "image/png",
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "DzRetour — Protégez votre commerce des retourneurs en Algérie",
    description:
      "Vérifiez les numéros de clients et signalez les retourneurs. Gratuit pour tous les marchands algériens.",
    images: ["/image.png"],
  },

  // Manifest PWA
  manifest: "/manifest.webmanifest",

  // Icônes
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.ico",
  },

  // Catégorie du site
  category: "business",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        {/* Preconnect pour accélérer le chargement des fonts Google */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Hreflang multilingue */}
        <link rel="alternate" hrefLang="ar" href={SITE_URL} />
        <link rel="alternate" hrefLang="fr" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </head>
      <body className={`${inter.variable} ${notoSansArabic.variable} antialiased`}>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1" id="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      {/* Google Analytics — remplace G-DRMEKP7VJF par ton Measurement ID */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-DRMEKP7VJF"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DRMEKP7VJF', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      </body>
    </html>
  )
}