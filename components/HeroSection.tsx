"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Shield, Search, ArrowLeft, ArrowRight, CheckCircle, TrendingUp, Users } from "lucide-react"

export default function HeroSection() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const isRtl = language === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  function handleQuickCheck(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = phone.replace(/\s/g, "")
    if (cleaned.length >= 9) {
      router.push(`/check?phone=${encodeURIComponent(cleaned)}`)
    }
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-amber-50/20 pt-20">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl float-animation" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-secondary/8 rounded-full blur-3xl float-animation" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary text-sm font-medium px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {isRtl ? "منصة موثوقة لتجار الجزائر" : "Plateforme de confiance pour les marchands algériens"}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight text-balance">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Quick search bar */}
          <form
            onSubmit={handleQuickCheck}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 left-4 rtl:left-auto rtl:right-4 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isRtl ? "0xxxxxxxxx" : "0xxxxxxxxx"}
                className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-4 rounded-xl border-2 border-border bg-white text-foreground font-mono text-base focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                maxLength={10}
              />
            </div>
            <button
              type="submit"
              className="btn-secondary flex items-center justify-center gap-2 px-6 py-4 whitespace-nowrap"
            >
              {isRtl ? "تحقق الآن" : "Vérifier"}
              <ArrowIcon className="h-4 w-4" />
            </button>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link href="/report" className="btn-primary flex items-center gap-2 px-8 py-4 w-full sm:w-auto">
              <Shield className="h-5 w-5" />
              {t("hero.cta.report")}
            </Link>
            <Link href="/check" className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-border text-foreground font-semibold hover:border-primary hover:text-primary transition-all duration-200 w-full sm:w-auto justify-center bg-white">
              <Search className="h-5 w-5" />
              {t("hero.cta.check")}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 text-sm text-muted-foreground">
            {[
              isRtl ? "مجاني تماماً" : "100% gratuit",
              isRtl ? "لا تسجيل مطلوب" : "Sans inscription",
              isRtl ? "بيانات موثوقة" : "Données fiables",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: TrendingUp, value: "10,000+", label: t("hero.stats.reports"), color: "text-primary" },
              { icon: Users, value: "5,000+", label: t("hero.stats.merchants"), color: "text-secondary" },
              { icon: Shield, value: "95%", label: t("hero.stats.accuracy"), color: "text-emerald-600" },
            ].map((stat, i) => (
              <div key={i} className="glass-card flex flex-col items-center py-6">
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
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