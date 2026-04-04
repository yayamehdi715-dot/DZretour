// 📁 EMPLACEMENT : components/HeroSection.tsx  (remplace l'existant)
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Shield, Search, ArrowLeft, ArrowRight, CheckCircle, TrendingUp, Phone } from "lucide-react"

export default function HeroSection() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [stats, setStats] = useState({ uniqueReportedPhones: 0, totalChecks: 0 })
  const isRtl = language === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  const fetchStats = useCallback(() => {
    // cache=no-store pour toujours avoir les données fraîches
    fetch("/api/stats", { cache: "no-store" })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Fetch initial
    fetchStats()

    // Track visite
    fetch("/api/track", { method: "POST" }).catch(() => {})

    // Écoute l'événement émis par la page /report après un signalement réussi
    const handleStatsUpdate = () => fetchStats()
    window.addEventListener("dzretour:stats-updated", handleStatsUpdate)
    return () => window.removeEventListener("dzretour:stats-updated", handleStatsUpdate)
  }, [fetchStats])

  function handleQuickCheck(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = phone.replace(/\s/g, "")
    if (cleaned.length >= 9) router.push(`/check?phone=${encodeURIComponent(cleaned)}`)
  }

  const statCards = [
    {
      icon: Phone,
      value: stats.uniqueReportedPhones.toLocaleString("fr-FR"),
      label: language === "ar"
        ? "رقم مُبلَّغ عنه"
        : language === "fr"
        ? "Numéros signalés"
        : "Reported Numbers",
      color: "text-primary",
    },
    {
      icon: Search,
      value: stats.totalChecks.toLocaleString("fr-FR"),
      label: language === "ar"
        ? "رقم تم التحقق منه"
        : language === "fr"
        ? "Téléphones vérifiés"
        : "Phones Checked",
      color: "text-secondary",
    },
    {
      icon: Shield,
      value: "95%",
      label: t("hero.stats.accuracy"),
      color: "text-emerald-600",
    },
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-amber-50/20 pt-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl float-animation" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-secondary/8 rounded-full blur-3xl float-animation" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary text-sm font-medium px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
            {language === "ar"
              ? "منصة موثوقة لتجار الجزائر"
              : language === "fr"
              ? "Plateforme de confiance pour les marchands algériens"
              : "Trusted platform for Algerian merchants"}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight text-balance">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Quick search */}
          <form onSubmit={handleQuickCheck} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 left-4 rtl:left-auto rtl:right-4 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0xxxxxxxxx"
                aria-label={language === "ar" ? "رقم الهاتف للتحقق" : language === "fr" ? "Numéro à vérifier" : "Phone number to check"}
                className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-4 rounded-xl border-2 border-border bg-white text-foreground font-mono text-base focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                maxLength={10}
              />
            </div>
            <button type="submit" className="btn-secondary flex items-center justify-center gap-2 px-6 py-4 whitespace-nowrap">
              {language === "ar" ? "تحقق الآن" : language === "fr" ? "Vérifier" : "Check"}
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link href="/report" className="btn-primary flex items-center gap-2 px-8 py-4 w-full sm:w-auto">
              <Shield className="h-5 w-5" aria-hidden="true" />
              {t("hero.cta.report")}
            </Link>
            <Link href="/check" className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-border text-foreground font-semibold hover:border-primary hover:text-primary transition-all duration-200 w-full sm:w-auto justify-center bg-white">
              <Search className="h-5 w-5" aria-hidden="true" />
              {t("hero.cta.check")}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 text-sm text-muted-foreground">
            {[
              language === "ar" ? "مجاني تماماً"   : language === "fr" ? "100% gratuit"      : "100% free",
              language === "ar" ? "لا تسجيل مطلوب" : language === "fr" ? "Sans inscription"  : "No registration",
              language === "ar" ? "بيانات موثوقة"  : language === "fr" ? "Données fiables"   : "Reliable data",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {statCards.map((stat, i) => (
              <div key={i} className="glass-card flex flex-col items-center py-6">
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} aria-hidden="true" />
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}