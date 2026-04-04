// 📁 EMPLACEMENT : app/manifest.ts  (nouveau fichier à créer)
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DzRetour — Protection des marchands algériens",
    short_name: "DzRetour",
    description:
      "Vérifiez les numéros de clients et signalez les retourneurs. Plateforme gratuite pour les marchands algériens.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#dc2626",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    lang: "fr",
    dir: "ltr",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/image.png",
        sizes: "499x457",
        type: "image/png",
        // @ts-ignore - form_factor est valide mais pas encore dans les types Next.js
        form_factor: "wide",
        label: "DzRetour — Page d'accueil",
      },
    ],
  }
}