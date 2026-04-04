"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Shield, CheckCircle, XCircle, ChevronDown, AlertTriangle, Check, Clipboard, X } from "lucide-react"
import Link from "next/link"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidation: (isValid: boolean) => void
}

function PhoneInput({ value, onChange, onValidation }: PhoneInputProps) {
  const { language } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [showPasteButton, setShowPasteButton] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX_ALGERIAN_DIGITS = 10

  useEffect(() => {
    const checkClipboard = async () => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText()
          setShowPasteButton(!!(!value && text && /[\d\s\+\-\(\)]{8,}/.test(text)))
        } catch { setShowPasteButton(false) }
      }
    }
    checkClipboard()
  }, [value])

  const formatAlgerianNumber = (phone: string) => {
    let cleaned = phone.replace(/[^\d+]/g, "")
    if (cleaned.startsWith("+213")) return "0" + cleaned.substring(4, 13)
    if (cleaned.startsWith("213") && cleaned.length > 3) return "0" + cleaned.substring(3, 12)
    if (cleaned.startsWith("0")) return cleaned.substring(0, MAX_ALGERIAN_DIGITS)
    if (cleaned.length === 9 && /^[567]/.test(cleaned)) return "0" + cleaned
    return cleaned.substring(0, MAX_ALGERIAN_DIGITS)
  }

  const isValidPhone = (phone: string) => /^0[567][0-9]{8}$/.test(phone.replace(/\s/g, ""))

  useEffect(() => { onValidation(isValidPhone(value)) }, [value, onValidation])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const formatted = formatAlgerianNumber(text.trim())
      onChange(formatted); setCopied(true); setShowPasteButton(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAlgerianNumber(e.target.value)
    if (formatted.length <= MAX_ALGERIAN_DIGITS) onChange(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8,9,27,13,46,37,38,39,40].includes(e.keyCode) ||
        (e.ctrlKey && [65,67,86,88,90].includes(e.keyCode)) ||
        (e.shiftKey && [37,38,39,40].includes(e.keyCode))) return
    const isNumber = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)
    if (!isNumber) { e.preventDefault(); return }
    if (value.length >= MAX_ALGERIAN_DIGITS && e.keyCode !== 8 && e.keyCode !== 46) e.preventDefault()
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="tel"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={language === "ar" ? "0xxxxxxxxx (10 أرقام)" : "0xxxxxxxxx (10 chiffres)"}
          maxLength={MAX_ALGERIAN_DIGITS}
          className={`w-full py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-white font-mono ${language === "ar" ? "text-right" : "text-left"} ${showPasteButton ? (language === "ar" ? "pl-14 pr-4" : "pr-14 pl-4") : "px-4"}`}
          dir="ltr"
        />
        {showPasteButton && (
          <button onClick={handlePaste} type="button"
            className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-3" : "right-3"} p-2 rounded-lg bg-primary text-white hover:bg-primary/90 w-10 h-10 flex items-center justify-center`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
          </button>
        )}
      </div>
      <div className={`mt-1 text-xs text-slate-400 ${language === "ar" ? "text-right" : "text-left"}`}>
        {value.length}/{MAX_ALGERIAN_DIGITS}
      </div>
      {value && (
        <div className={`mt-2 text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
          {isValidPhone(value) ? (
            <span className="text-green-600 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {language === "ar" ? "رقم جزائري صحيح" : "Numéro algérien valide"}
            </span>
          ) : value.length > 0 ? (
            <span className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {language === "ar" ? "رقم غير صحيح (يجب أن يبدأ بـ 0 ويحتوي على 10 أرقام)" : "Numéro invalide (doit commencer par 0 et contenir 10 chiffres)"}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Confirmation Modal ─────────────────────────────────────────────────────
function ConfirmModal({
  phone, reason, onConfirm, onCancel, language,
}: {
  phone: string; reason: string; onConfirm: () => void; onCancel: () => void; language: string
}) {
  const isFr = language === "fr"
  const isAr = language === "ar"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          {isAr ? "تأكيد الإبلاغ" : isFr ? "Confirmer le signalement" : "Confirm Report"}
        </h2>

        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
          {isAr
            ? "هل أنت متأكد من رغبتك في الإبلاغ عن هذا الرقم؟"
            : isFr
            ? "Êtes-vous sûr de vouloir signaler ce numéro ?"
            : "Are you sure you want to report this number?"}
        </p>

        {/* Phone + reason recap */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{isAr ? "الرقم" : isFr ? "Numéro" : "Number"}</span>
            <span className="font-mono font-bold text-gray-900">{phone}</span>
          </div>
          {reason && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{isAr ? "السبب" : isFr ? "Raison" : "Reason"}</span>
              <span className="text-sm text-gray-700 text-end">{reason}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            {isAr ? "إلغاء" : isFr ? "Annuler" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            {isAr ? "نعم، أبلغ" : isFr ? "Oui, signaler" : "Yes, report"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReportPage() {
  const { t, language } = useLanguage()
  const [phone, setPhone] = useState("")
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const reasonsByLang: Record<string, string[]> = {
    ar: ["عدم الرضا عن المنتج", "رفض فتح الطرد", "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى"],
    fr: ["Insatisfaction produit", "Refus d'ouvrir le colis", "Colis endommagé à la livraison", "Changement d'avis du client", "Autre"],
    en: ["Product dissatisfaction", "Refused to open package", "Package damaged during delivery", "Customer changed mind", "Other"],
  }
  const reasons = reasonsByLang[language] ?? reasonsByLang.fr
  const otherLabel = { ar: "أخرى", fr: "Autre", en: "Other" }[language] ?? "Autre"

  useEffect(() => { setReason(""); setCustomReason(""); setIsDropdownOpen(false) }, [language])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    if (isDropdownOpen) { document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler) }
  }, [isDropdownOpen])

  // Called when user clicks "Signaler" → show confirmation popup
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !phone || !agreedToTerms || !reason) return
    setShowConfirm(true)
  }

  // Called when user confirms in the modal
  const handleConfirmedSubmit = async () => {
    setShowConfirm(false)
    setIsLoading(true)
    setMessage("")

    const requestBody: any = { phone: phone.replace(/\s/g, ""), reason }
    if (reason === otherLabel && customReason.trim()) requestBody.customReason = customReason.trim()

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(t("report.success"))
        setPhone(""); setReason(""); setCustomReason(""); setAgreedToTerms(false); setIsValid(false)
      } else {
        const msgs: Record<string, string> = {
          DUPLICATE_REPORT: language === "ar" ? "تم الإبلاغ عن هذا الرقم مؤخراً" : "Ce numéro a déjà été signalé récemment",
          RATE_LIMITED:     language === "ar" ? "تم تجاوز الحد المسموح. حاول لاحقاً" : "Limite dépassée. Réessayez plus tard",
          INVALID_PHONE:    language === "ar" ? "تنسيق رقم الهاتف غير صحيح" : "Format de numéro invalide",
          INVALID_REASON:   language === "ar" ? "السبب المحدد غير صحيح" : "Raison invalide",
        }
        setMessage(msgs[data.code] || data.error || t("report.error"))
      }
    } catch {
      setMessage(language === "ar" ? "خطأ في الشبكة" : "Erreur réseau. Vérifiez votre connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("report.title"),
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/report`,
  }

  const isOtherSelected = reason === otherLabel
  const canSubmit = isValid && !!phone && agreedToTerms && !!reason && !(isOtherSelected && !customReason.trim())

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Confirmation modal */}
      {showConfirm && (
        <ConfirmModal
          phone={phone}
          reason={reason}
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirm(false)}
          language={language}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br mt-12 from-slate-50 to-slate-100 pt-20 pb-8">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("report.title")}</h1>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <form onSubmit={handleSubmitClick} className="space-y-6">

              {/* Phone */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                  {t("report.phone.label")} *
                </label>
                <div className={language === "ar" ? "rtl" : "ltr"}>
                  <PhoneInput value={phone} onChange={setPhone} onValidation={setIsValid} />
                </div>
              </div>

              {/* Reason dropdown */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                  {t("report.reason.label")}
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white flex items-center justify-between hover:border-slate-300 focus:outline-none ${language === "ar" ? "text-right" : "text-left"}`}
                  >
                    <span className={reason ? "text-slate-900" : "text-slate-500"}>
                      {reason || t("report.reason.placeholder")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {reasons.map((r, i) => (
                        <button
                          key={i} type="button"
                          onClick={() => { setReason(r); setIsDropdownOpen(false) }}
                          className={`w-full px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} ${reason === r ? "bg-primary/5 text-primary font-medium" : "text-slate-700"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isOtherSelected && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={language === "ar" ? "اكتب السبب..." : "Écrivez la raison..."}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white resize-none mt-3 ${language === "ar" ? "text-right" : "text-left"}`}
                    rows={3} maxLength={200} dir={language === "ar" ? "rtl" : "ltr"}
                  />
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" id="terms-agreement" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="sr-only" />
                  <label htmlFor="terms-agreement" className={`flex items-center justify-center w-5 h-5 rounded-md border-2 cursor-pointer transition-all ${agreedToTerms ? "bg-primary border-primary" : "bg-white border-slate-300 hover:border-primary/50"}`}>
                    {agreedToTerms && <CheckCircle className="w-3 h-3 text-white" />}
                  </label>
                </div>
                <p className={`text-sm text-slate-700 leading-relaxed ${language === "ar" ? "text-right" : "text-left"}`}>
                  {language === "ar" ? (
                    <>أوافق على{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">شروط الاستخدام</Link>{" "}و{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">سياسة الخصوصية</Link></>
                  ) : language === "fr" ? (
                    <>J'accepte les{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">conditions d'utilisation</Link>{" "}et la{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">politique de confidentialité</Link></>
                  ) : (
                    <>I agree to the{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">terms of use</Link>{" "}and{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">privacy policy</Link></>
                  )}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 min-h-[48px]"
              >
                {isLoading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />{t("loading")}</>
                ) : (
                  <><Shield className="w-5 h-5" />{t("report.submit")}</>
                )}
              </button>

              {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message === t("report.success") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  {message === t("report.success")
                    ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  <span className="font-medium text-sm">{message}</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{t("report.secure")}</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />{t("report.verified")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}