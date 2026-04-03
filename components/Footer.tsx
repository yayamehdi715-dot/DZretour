"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { Instagram, Shield } from "lucide-react"

export default function Footer() {
  const { t, language } = useLanguage()
  const isRtl = language === "ar"

  return (
    <footer className="bg-gray-900 text-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-14 border-b border-white/10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">DzRetour</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-widest">
              {t("footer.links")}
            </h3>
            <ul className="space-y-3">
              {[
                { label: t("nav.home"), href: "/" },
                { label: t("nav.report"), href: "/report" },
                { label: t("nav.check"), href: "/check" },
                { label: t("nav.terms"), href: "/terms" },
                { label: t("nav.privacy"), href: "/privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-widest">
              {t("footer.contact")}
            </h3>
            <a
              href="https://www.instagram.com/dz.retour/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
            >
              <Instagram className="h-5 w-5 group-hover:text-pink-400 transition-colors" />
              @dz.retour
            </a>
            <p className="text-gray-500 text-xs mt-6 leading-relaxed">
              {isRtl
                ? "منصة مجتمعية لحماية التجار في الجزائر"
                : "Plateforme communautaire pour protéger les marchands algériens"}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-sm">
          <p>© 2025 DzRetour. {t("footer.rights")}.</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {isRtl ? "الخدمة تعمل بشكل طبيعي" : "Service opérationnel"}
          </div>
        </div>
      </div>
    </footer>
  )
}