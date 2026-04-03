"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Megaphone, Search, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react"

const FEATURES = [
  {
    icon: Megaphone,
    titleKey: "features.report.title",
    descKey: "features.report.description",
    href: "/report",
    gradient: "from-red-50 to-rose-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    border: "border-red-100 hover:border-red-300",
    ctaColor: "text-red-600",
  },
  {
    icon: Search,
    titleKey: "features.check.title",
    descKey: "features.check.description",
    href: "/check",
    gradient: "from-blue-50 to-sky-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-100 hover:border-blue-300",
    ctaColor: "text-blue-600",
  },
  {
    icon: ShieldCheck,
    titleKey: "features.protect.title",
    descKey: "features.protect.description",
    href: "/report",
    gradient: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-emerald-100 hover:border-emerald-300",
    ctaColor: "text-emerald-600",
  },
]

export default function FeaturesSection() {
  const { t, language } = useLanguage()
  const isRtl = language === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest mb-3 block">
            {isRtl ? "مميزاتنا" : "Nos fonctionnalités"}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            {t("features.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f, i) => (
            <Link
              key={i}
              href={f.href}
              className={`group relative bg-gradient-to-br ${f.gradient} border-2 ${f.border} rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`h-7 w-7 ${f.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200">
                {t(f.titleKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm flex-1 mb-6">
                {t(f.descKey)}
              </p>

              {/* CTA */}
              <span className={`flex items-center gap-2 text-sm font-semibold ${f.ctaColor}`}>
                {isRtl ? "اكتشف المزيد" : "En savoir plus"}
                <ArrowIcon className="h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-200" />
              </span>
            </Link>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div className="mt-16 bg-gradient-to-r from-primary to-red-700 rounded-3xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            {isRtl ? "ابدأ الآن مجاناً" : "Commencez gratuitement"}
          </h3>
          <p className="text-white/80 mb-6 text-base max-w-xl mx-auto">
            {isRtl
              ? "انضم إلى آلاف التجار الذين يحمون تجارتهم مع DzRetour"
              : "Rejoignez des milliers de marchands qui protègent leur business avec DzRetour"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report" className="bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors">
              {t("hero.cta.report")}
            </Link>
            <Link href="/check" className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/20 transition-colors">
              {t("hero.cta.check")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}