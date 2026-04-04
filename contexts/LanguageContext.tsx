"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "ar" | "en" | "fr"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.report": "أبلغ",
    "nav.check": "تحقق",
    "nav.terms": "الشروط",
    "nav.privacy": "الخصوصية",

    "hero.title": "احمِ تجارتك من روتور في الجزائر",
    "hero.subtitle": "منصة تبادل بيانات روتور لتجار الجزائر. تحقق من أرقام العملاء وأبلغ عن روتور لحماية تجارتك وتقليل الخسائر.",
    "hero.cta.report": "أبلغ الآن",
    "hero.cta.check": "تحقق الآن",
    "hero.stats.reports": "تقرير موثق",
    "hero.stats.merchants": "تاجر محمي",
    "hero.stats.accuracy": "دقة التحقق",

    "features.title": "كيف يعمل DzRetour؟",
    "features.subtitle": "منصة بسيطة وفعّالة لحماية تجارتك",
    "features.report.title": "أبلغ عن روتور",
    "features.report.description": "ساعد التجار الآخرين بالإبلاغ عن حالات روتور",
    "features.check.title": "تحقق من الأرقام",
    "features.check.description": "تحقق من تاريخ رقم الهاتف قبل الشحن",
    "features.protect.title": "احمِ تجارتك",
    "features.protect.description": "قلل من خسائر روتور وزد أرباحك",

    "report.title": "أبلغ عن روتور",
    "report.phone.label": "رقم الهاتف",
    "report.phone.placeholder": "مثال: +213 555 123 456",
    "report.phone.help": "أدخل رقم الهاتف الجزائري بالتنسيق الصحيح",
    "report.reason.label": "سبب روتور (اختياري)",
    "report.reason.placeholder": "اختر السبب",
    "report.reason.product_dissatisfaction": "عدم الرضا عن المنتج",
    "report.reason.refused_to_open": "رفض فتح الطرد",
    "report.reason.package_damaged": "تلف الطرد أثناء التوصيل",
    "report.reason.changed_mind": "تغيير رأي العميل",
    "report.reason.other": "أخرى",
    "report.evidence.label": "رابط الدليل (اختياري)",
    "report.evidence.placeholder": "رابط الصورة أو الفيديو",
    "report.submit": "أبلغ الآن",
    "report.success": "تم الإبلاغ بنجاح",
    "report.error": "حدث خطأ، حاول مرة أخرى",
    "report.secure": "بياناتك آمنة ومحمية",
    "report.verified": "تم التحقق من البيانات",
    "report.terms.agree": "أوافق على",
    "report.terms.and": "و",

    "check.title": "تحقق من رقم",
    "check.phone.label": "رقم الهاتف",
    "check.phone.placeholder": "أدخل رقم الهاتف",
    "check.submit": "تحقق",
    "check.risk.high": "خطر عالي",
    "check.risk.medium": "خطر متوسط",
    "check.risk.low": "مشبوه",
    "check.risk.safe": "آمن",
    "check.reports": "عدد البلاغات",
    "check.last_reported": "آخر بلاغ",
    "check.protect_cta": "حماية تجارتك",

    "footer.description": "منصة تبادل بيانات روتور لحماية التجار في الجزائر",
    "footer.links": "روابط مهمة",
    "footer.contact": "اتصل بنا",
    "footer.rights": "جميع الحقوق محفوظة",

    loading: "جاري التحميل...",
    error: "حدث خطأ",
    "phone.invalid": "رقم الهاتف غير صحيح",
    "phone.format": "يجب أن يبدأ الرقم بـ +213",
  },

  fr: {
    "nav.home": "Accueil",
    "nav.report": "Signaler",
    "nav.check": "Vérifier",
    "nav.terms": "Conditions",
    "nav.privacy": "Confidentialité",

    "hero.title": "Protégez votre commerce des retourneurs en Algérie",
    "hero.subtitle": "Plateforme de partage de données pour les marchands algériens. Vérifiez les numéros de clients et signalez les retourneurs pour protéger votre business.",
    "hero.cta.report": "Signaler maintenant",
    "hero.cta.check": "Vérifier maintenant",
    "hero.stats.reports": "Signalements documentés",
    "hero.stats.merchants": "Marchands protégés",
    "hero.stats.accuracy": "Précision de vérification",

    "features.title": "Comment fonctionne DzRetour ?",
    "features.subtitle": "Une plateforme simple et efficace pour protéger votre commerce",
    "features.report.title": "Signaler un retourneur",
    "features.report.description": "Aidez les autres marchands en signalant les cas de retour abusif",
    "features.check.title": "Vérifier un numéro",
    "features.check.description": "Consultez l'historique d'un numéro avant d'expédier",
    "features.protect.title": "Protéger votre commerce",
    "features.protect.description": "Réduisez vos pertes liées aux retours et augmentez vos profits",

    "report.title": "Signaler un retourneur",
    "report.phone.label": "Numéro de téléphone",
    "report.phone.placeholder": "Exemple : +213 555 123 456",
    "report.phone.help": "Entrez le numéro de téléphone algérien au bon format",
    "report.reason.label": "Raison du retour (optionnel)",
    "report.reason.placeholder": "Choisir une raison",
    "report.reason.product_dissatisfaction": "Insatisfaction produit",
    "report.reason.refused_to_open": "Refus d'ouvrir le colis",
    "report.reason.package_damaged": "Colis endommagé à la livraison",
    "report.reason.changed_mind": "Changement d'avis du client",
    "report.reason.other": "Autre",
    "report.evidence.label": "Lien de preuve (optionnel)",
    "report.evidence.placeholder": "Lien image ou vidéo",
    "report.submit": "Signaler maintenant",
    "report.success": "Signalement soumis avec succès",
    "report.error": "Une erreur est survenue, réessayez",
    "report.secure": "Vos données sont sécurisées",
    "report.verified": "Données vérifiées",
    "report.terms.agree": "J'accepte les",
    "report.terms.and": "et la",

    "check.title": "Vérifier un numéro",
    "check.phone.label": "Numéro de téléphone",
    "check.phone.placeholder": "Entrez le numéro de téléphone",
    "check.submit": "Vérifier",
    "check.risk.high": "Dangereux — À fuir",
    "check.risk.medium": "Probablement dangereux",
    "check.risk.low": "Suspect",
    "check.risk.safe": "Sûr",
    "check.reports": "Nombre de signalements",
    "check.last_reported": "Dernier signalement",
    "check.protect_cta": "Protéger votre commerce",

    "footer.description": "Plateforme de signalement pour protéger les marchands algériens",
    "footer.links": "Liens utiles",
    "footer.contact": "Contact",
    "footer.rights": "Tous droits réservés",

    loading: "Chargement...",
    error: "Une erreur est survenue",
    "phone.invalid": "Numéro de téléphone invalide",
    "phone.format": "Le numéro doit commencer par +213",
  },

  en: {
    "nav.home": "Home",
    "nav.report": "Report",
    "nav.check": "Check",
    "nav.terms": "Terms",
    "nav.privacy": "Privacy",

    "hero.title": "Protect Your Business from Returners in Algeria",
    "hero.subtitle": "Return data sharing platform for Algerian merchants. Check customer numbers and report returners to protect your business and reduce losses.",
    "hero.cta.report": "Report Now",
    "hero.cta.check": "Check Now",
    "hero.stats.reports": "Documented Reports",
    "hero.stats.merchants": "Protected Merchants",
    "hero.stats.accuracy": "Verification Accuracy",

    "features.title": "How does DzRetour work?",
    "features.subtitle": "A simple and effective platform to protect your business",
    "features.report.title": "Report a Returner",
    "features.report.description": "Help other merchants by reporting return abuse cases",
    "features.check.title": "Check Numbers",
    "features.check.description": "Check a phone number's history before shipping",
    "features.protect.title": "Protect Your Business",
    "features.protect.description": "Reduce return losses and increase your profits",

    "report.title": "Report a Returner",
    "report.phone.label": "Phone Number",
    "report.phone.placeholder": "Example: +213 555 123 456",
    "report.phone.help": "Enter Algerian phone number in correct format",
    "report.reason.label": "Return Reason (optional)",
    "report.reason.placeholder": "Choose reason",
    "report.reason.product_dissatisfaction": "Product dissatisfaction",
    "report.reason.refused_to_open": "Refused to open package",
    "report.reason.package_damaged": "Package damaged during delivery",
    "report.reason.changed_mind": "Customer changed mind",
    "report.reason.other": "Other",
    "report.evidence.label": "Evidence Link (optional)",
    "report.evidence.placeholder": "Image or video link",
    "report.submit": "Report Now",
    "report.success": "Report submitted successfully",
    "report.error": "Error occurred, please try again",
    "report.secure": "Your data is secure and protected",
    "report.verified": "Data has been verified",
    "report.terms.agree": "I agree to the",
    "report.terms.and": "and",

    "check.title": "Check a Number",
    "check.phone.label": "Phone Number",
    "check.phone.placeholder": "Enter phone number",
    "check.submit": "Check",
    "check.risk.high": "Dangerous — Avoid",
    "check.risk.medium": "Probably Dangerous",
    "check.risk.low": "Suspicious",
    "check.risk.safe": "Safe",
    "check.reports": "Number of Reports",
    "check.last_reported": "Last Reported",
    "check.protect_cta": "Protect Your Business",

    "footer.description": "Return reporting platform to protect merchants in Algeria",
    "footer.links": "Important Links",
    "footer.contact": "Contact Us",
    "footer.rights": "All rights reserved",

    loading: "Loading...",
    error: "An error occurred",
    "phone.invalid": "Invalid phone number",
    "phone.format": "Number must start with +213",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar")

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && ["ar", "en", "fr"].includes(savedLang)) {
      setLanguage(savedLang)
    } else {
      localStorage.setItem("language", "ar")
      setLanguage("ar")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("language", language)
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"

    if (language === "ar") {
      document.documentElement.classList.add("font-arabic")
    } else {
      document.documentElement.classList.remove("font-arabic")
    }
  }, [language])

  const t = (key: string): string => {
    const lang = ["ar", "en", "fr"].includes(language) ? language : "ar"
    const currentTranslations = translations[lang]
    return (currentTranslations as any)[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}