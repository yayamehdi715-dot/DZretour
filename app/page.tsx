// 📁 EMPLACEMENT : app/page.tsx  (remplace l'existant)
import type { Metadata } from "next"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeaturesSection"
import FAQSection from "@/components/FAQSection"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dzretours.vercel.app"

export const metadata: Metadata = {
  title: "DzRetour — Protégez votre commerce des retourneurs en Algérie",
  description:
    "Plateforme communautaire gratuite pour les marchands algériens. Vérifiez un numéro avant d'expédier, signalez les retourneurs, protégez votre business.",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar": SITE_URL,
      "fr": SITE_URL,
      "en": SITE_URL,
    },
  },
  openGraph: {
    url: SITE_URL,
    title: "DzRetour — Protégez votre commerce des retourneurs en Algérie",
    description: "Vérifiez les numéros de clients et signalez les retourneurs. Gratuit pour tous les marchands algériens.",
  },
}

export default function HomePage() {
  // Schéma 1 : WebSite avec SearchAction (barre de recherche dans Google)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DzRetour",
    alternateName: ["دزريتور", "Dz Retour"],
    description: "Plateforme de protection des marchands algériens contre les retourneurs",
    url: SITE_URL,
    inLanguage: ["ar", "fr", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/check?phone={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  // Schéma 2 : Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DzRetour",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    sameAs: ["https://www.instagram.com/cvkdev/"],
    description: "Plateforme communautaire pour la protection des marchands algériens contre les retourneurs abusifs",
    areaServed: {
      "@type": "Country",
      name: "Algeria",
    },
    knowsAbout: [
      "E-commerce protection",
      "Return fraud prevention",
      "Algerian merchants",
    ],
  }

  // Schéma 3 : WebApplication
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DzRetour",
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "DZD",
      description: "Service gratuit pour les marchands algériens",
    },
    featureList: [
      "Vérification de numéros de clients",
      "Signalement de retourneurs",
      "Base de données collaborative",
      "Score de risque automatique",
    ],
  }

  // Schéma 4 : FAQPage (améliore l'apparition dans les résultats Google)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que DzRetour ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DzRetour est une plateforme communautaire gratuite qui aide les marchands algériens à se protéger des retourneurs en partageant des informations sur les numéros suspects.",
        },
      },
      {
        "@type": "Question",
        name: "Comment vérifier si un client est un retourneur ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entrez le numéro de téléphone algérien du client sur la page de vérification. Le système consulte notre base de données et affiche un score de risque basé sur les signalements passés.",
        },
      },
      {
        "@type": "Question",
        name: "Comment signaler un retourneur ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rendez-vous sur la page de signalement, entrez le numéro de téléphone du client, choisissez une raison et soumettez. L'opération prend moins d'une minute.",
        },
      },
      {
        "@type": "Question",
        name: "Le service DzRetour est-il gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, DzRetour est entièrement gratuit pour tous les marchands algériens. Aucune inscription ni abonnement n'est nécessaire.",
        },
      },
      {
        "@type": "Question",
        name: "Comment est calculé le niveau de risque d'un numéro ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le niveau de risque est basé sur le nombre de signalements reçus : 0-1 signalement = sûr, 2-3 = suspect, 4-5 = probablement dangereux, 6 et plus = dangereux à fuir.",
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
    </>
  )
}