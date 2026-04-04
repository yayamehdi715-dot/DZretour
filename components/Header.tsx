// 📁 EMPLACEMENT : components/Header.tsx  (remplace l'existant)
"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { Menu, X, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export default function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isRtl = language === "ar"

  // Ferme le drawer quand on change de page
  useEffect(() => { setIsMenuOpen(false) }, [pathname])

  // Empêche le scroll quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isMenuOpen])

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/report", label: t("nav.report") },
    { href: "/check", label: t("nav.check") },
  ]

  const langs: { code: "ar" | "en" | "fr"; label: string; ariaLabel: string }[] = [
    { code: "ar", label: "ع", ariaLabel: "Langue arabe" },
    { code: "fr", label: "FR", ariaLabel: "Langue française" },
    { code: "en", label: "EN", ariaLabel: "English language" },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/images/logo.png" alt="DzRetour Logo" width={44} height={44} className="h-11 w-11 group-hover:scale-105 transition-transform duration-200" />
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">DzRetour</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5" role="group" aria-label="Sélection de la langue">
                {langs.map(({ code, label, ariaLabel }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    aria-label={ariaLabel}
                    aria-pressed={language === code}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      language === code ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Link href="/check" className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t("nav.check")}
              </Link>
            </div>

            {/* Mobile right side — langue toujours visible + bouton menu */}
            <div className="md:hidden flex items-center gap-2">
              {/* Switcher de langue visible sans ouvrir le menu */}
              <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5" role="group" aria-label="Sélection de la langue">
                {langs.map(({ code, label, ariaLabel }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    aria-label={ariaLabel}
                    aria-pressed={language === code}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      language === code ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Bouton menu hamburger */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-drawer"
                aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen
                  ? <X className="h-6 w-6" aria-hidden="true" />
                  : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay sombre */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer latéral — glisse depuis la droite (gauche en RTL) */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed top-0 ${isRtl ? "left-0" : "right-0"} h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen
            ? "translate-x-0"
            : isRtl ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        {/* En-tête du drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-foreground">DzRetour</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Fermer le menu"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Liens de navigation */}
        <nav className="px-4 py-4 space-y-1" aria-label="Navigation mobile">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Vérifier */}
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <Link
            href="/check"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-3 rounded-xl w-full hover:bg-primary/90 transition-colors"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {t("nav.check")}
          </Link>
        </div>
      </div>
    </>
  )
}