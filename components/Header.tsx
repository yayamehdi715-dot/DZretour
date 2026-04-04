"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { Menu, X, Search } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/report", label: t("nav.report") },
    { href: "/check", label: t("nav.check") },
  ]

  const langs: { code: "ar" | "en" | "fr"; label: string }[] = [
    { code: "ar", label: "ع" },
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
            <Image src="/images/logo.png" alt="DzRetour Logo" width={44} height={44} className="h-11 w-11 group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">DzRetour</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
              {langs.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    language === code ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link href="/check" className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
              <Search className="h-4 w-4" />
              {t("nav.check")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                {langs.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => { setLanguage(code); setIsMenuOpen(false) }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      language === code ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Link href="/check" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-3 rounded-xl w-full">
                <Search className="h-4 w-4" />
                {t("nav.check")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}