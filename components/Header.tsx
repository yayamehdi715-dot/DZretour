"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { Menu, X, Shield, Search } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isRtl = language === "ar"

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/report", label: t("nav.report") },
    { href: "/check", label: t("nav.check") },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
            <Image
              src="/images/logo.png"
              alt="DzRetour Logo"
              width={44}
              height={44}
              className="h-11 w-11 group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              DzRetour
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Lang switcher */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 text-sm">
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  language === "ar"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  language === "en"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
            </div>

            {/* CTA */}
            <Link
              href="/check"
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Search className="h-4 w-4" />
              {t("nav.check")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="pt-3 pb-1 border-t border-gray-100">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 text-sm mb-3">
                <button
                  onClick={() => { setLanguage("ar"); setIsMenuOpen(false) }}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    language === "ar" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => { setLanguage("en"); setIsMenuOpen(false) }}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    language === "en" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  English
                </button>
              </div>
              <Link
                href="/check"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors w-full"
              >
                <Search className="h-4 w-4" />
                {t("nav.check")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}