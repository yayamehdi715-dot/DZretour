// 📁 EMPLACEMENT : app/report/page.tsx  (remplace l'existant)
"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Shield, CheckCircle, XCircle, ChevronDown, AlertTriangle, Check, Clipboard, X } from "lucide-react"
import Link from "next/link"

// ── PhoneInput ─────────────────────────────────────────────────────────────
interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidation: (isValid: boolean) => void
}

function PhoneInput({ value, onChange, onValidation }: PhoneInputProps) {
  const { language } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [showPasteButton, setShowPasteButton] = useState(false)
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

  function formatAlgerianNumber(phone: string): string {
    // Garde uniquement les chiffres et le +
    let cleaned = phone.replace(/[^\d+]/g, "")
    if (cleaned.startsWith("+213")) cleaned = "0" + cleaned.substring(4)
    else if (cleaned.startsWith("213") && cleaned.length > 3) cleaned = "0" + cleaned.substring(3)
    if (cleaned.startsWith("0")) return cleaned.substring(0, MAX_ALGERIAN_DIGITS)
    if (/^[567]\d{0,8}$/.test(cleaned)) return "0" + cleaned.substring(0, 9)
    return cleaned.substring(0, MAX_ALGERIAN_DIGITS)
  }

  function isValidPhone(phone: string): boolean {
    return /^0[567][0-9]{8}$/.test(phone.replace(/\s/g, ""))
  }

  useEffect(() => { onValidation(isValidPhone(value)) }, [value, onValidation])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const formatted = formatAlgerianNumber(text.trim())
      onChange(formatted)
      setCopied(true)
      setShowPasteButton(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // On laisse handleInputChange gérer tout — on ne bloque plus onKeyDown
    const formatted = formatAlgerianNumber(e.target.value)
    if (formatted.length <= MAX_ALGERIAN_DIGITS) onChange(formatted)
  }

  const pasteLabel = language === "ar" ? "لصق من الحافظة" : "Coller depuis le presse-papier"

  return (
    <div className="relative">
      <div className="relative">
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          // ⚠️ PAS de onKeyDown — e.keyCode est déprécié et bloque les claviers AZERTY/mobile
          placeholder={language === "ar" ? "0xxxxxxxxx (10 أرقام)" : "0xxxxxxxxx (10 chiffres)"}
          maxLength={MAX_ALGERIAN_DIGITS}
          autoComplete="tel"
          aria-required="true"
          aria-describedby="phone-hint phone-validation"
          className={`w-full py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 bg-white font-mono ${language === "ar" ? "text-right" : "text-left"} ${showPasteButton ? (language === "ar" ? "pl-14 pr-4" : "pr-14 pl-4") : "px-4"}`}
          dir="ltr"
        />
        {showPasteButton && (
          <button
            type="button"
            onClick={handlePaste}
            aria-label={pasteLabel}
            title={pasteLabel}
            className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-3" : "right-3"} p-2 rounded-lg bg-primary text-white hover:bg-primary/90 w-10 h-10 flex items-center justify-center`}
          >
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Clipboard className="w-4 h-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div id="phone-hint" className={`mt-1 text-xs text-slate-400 ${language === "ar" ? "text-right" : "text-left"}`}>
        {value.length}/{MAX_ALGERIAN_DIGITS}
      </div>

      <div id="phone-validation" aria-live="polite">
        {value && (
          <div className={`mt-2 text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
            {isValidPhone(value) ? (
              <span className="text-green-600 flex items-center gap-2">
                <Check className="w-4 h-4" aria-hidden="true" />
                {language === "ar" ? "رقم جزائري صحيح" : "Numéro algérien valide"}
              </span>
            ) : value.length > 0 ? (
              <span className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                {language === "ar"
                  ? "رقم غير صحيح (يبدأ بـ 0 ويحتوي على 10 أرقام)"
                  : "Numéro invalide (doit commencer par 0, 10 chiffres)"}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Confirmation Modal ─────────────────────────────────────────────────────
function ConfirmModal({ phone, reason, onConfirm, onCancel, language }: {
  phone: string; reason: string; onConfirm: () => void; onCancel: () => void; language: string
}) {
  const isFr = language === "fr"
  const isAr = language === "ar"

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <button type="button" onClick={onCancel} aria-label="Fermer" className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center" aria-hidden="true">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h2 id="confirm-title" className="text-xl font-bold text-gray-900 text-center mb-2">
          {isAr ? "تأكيد الإبلاغ" : isFr ? "Confirmer le signalement" : "Confirm Report"}
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
          {isAr
            ? "هل أنت متأكد من رغبتك في الإبلاغ عن هذا الرقم؟"
            : isFr
            ? "Êtes-vous sûr de vouloir signaler ce numéro ?"
            : "Are you sure you want to report this number?"}
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{isAr ? "الرقم" : isFr ? "Numéro" : "Number"}</span>
            <span className="font-mono font-bold text-gray-900">{phone}</span>
          </div>
          {reason && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{isAr ? "السبب" : isFr ? "Raison" : "Reason"}</span>
              <span className="text-sm text-gray-700">{reason}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            {isAr ? "إلغاء" : isFr ? "Annuler" : "Cancel"}
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm">
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
  const [messageType, setMessageType] = useState<"success" | "error">("error")
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
  const otherLabel = ({ ar: "أخرى", fr: "Autre", en: "Other" } as Record<string, string>)[language] ?? "Autre"

  useEffect(() => { setReason(""); setCustomReason(""); setIsDropdownOpen(false) }, [language])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }
  }, [isDropdownOpen])

  const handleValidation = useCallback((v: boolean) => setIsValid(v), [])

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !phone || !agreedToTerms || !reason) return
    setShowConfirm(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false)
    setIsLoading(true)
    setMessage("")

    const requestBody: Record<string, string> = { phone: phone.replace(/\s/g, ""), reason }
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
        setMessageType("success")
        setPhone(""); setReason(""); setCustomReason("")
        setAgreedToTerms(false); setIsValid(false)

        // Notifie HeroSection de rafraîchir les stats
        window.dispatchEvent(new Event("dzretour:stats-updated"))
      } else {
        const msgs: Record<string, string> = {
          DUPLICATE_REPORT: language === "ar"
            ? "لقد أبلغت بالفعل عن هذا الرقم. يمكنك إعادة الإبلاغ بعد 3 أيام."
            : "Vous avez déjà signalé ce numéro. Réessayez dans 3 jours.",
          RATE_LIMITED:   language === "ar" ? "تجاوزت الحد. حاول لاحقاً" : "Limite dépassée. Réessayez plus tard",
          INVALID_PHONE:  language === "ar" ? "تنسيق رقم غير صحيح" : "Format de numéro invalide",
          INVALID_REASON: language === "ar" ? "السبب غير صحيح" : "Raison invalide",
        }
        setMessage(msgs[data.code] || data.error || t("report.error"))
        setMessageType("error")
      }
    } catch {
      setMessage(language === "ar" ? "خطأ في الشبكة" : "Erreur réseau. Vérifiez votre connexion")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const isOtherSelected = reason === otherLabel
  const canSubmit = isValid && !!phone && agreedToTerms && !!reason && !(isOtherSelected && !customReason.trim())

  return (
    <>
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
            <form onSubmit={handleSubmitClick} className="space-y-6" noValidate>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone-input" className={`block text-sm font-medium text-slate-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                  {t("report.phone.label")} <span aria-hidden="true">*</span>
                </label>
                <div className={language === "ar" ? "rtl" : "ltr"}>
                  <PhoneInput value={phone} onChange={setPhone} onValidation={handleValidation} />
                </div>
              </div>

              {/* Reason dropdown */}
              <div className="space-y-2">
                <label id="reason-label" className={`block text-sm font-medium text-slate-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                  {t("report.reason.label")}
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    aria-labelledby="reason-label"
                    aria-expanded={isDropdownOpen ? "true" : "false"}
                    aria-haspopup="listbox"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white flex items-center justify-between hover:border-slate-300 focus:outline-none ${language === "ar" ? "text-right" : "text-left"}`}
                  >
                    <span className={reason ? "text-slate-900" : "text-slate-500"}>
                      {reason || t("report.reason.placeholder")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>

                  {isDropdownOpen && (
                    <ul role="listbox" aria-labelledby="reason-label" className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {reasons.map((r, i) => (
                        <li
                          key={i}
                          role="option"
                          aria-selected={reason === r ? "true" : "false"}
                          tabIndex={0}
                          onClick={() => { setReason(r); setIsDropdownOpen(false) }}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setReason(r); setIsDropdownOpen(false) } }}
                          className={`px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 focus:outline-none focus:bg-slate-50 ${language === "ar" ? "text-right" : "text-left"} ${reason === r ? "bg-primary/5 text-primary font-medium" : "text-slate-700"}`}
                        >
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isOtherSelected && (
                  <div className="mt-3">
                    <label htmlFor="custom-reason" className="sr-only">
                      {language === "ar" ? "سبب آخر" : "Autre raison"}
                    </label>
                    <textarea
                      id="custom-reason"
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      placeholder={language === "ar" ? "اكتب السبب..." : "Écrivez la raison..."}
                      className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white resize-none ${language === "ar" ? "text-right" : "text-left"}`}
                      rows={3}
                      maxLength={200}
                      dir={language === "ar" ? "rtl" : "ltr"}
                    />
                    <p className={`text-xs text-slate-500 mt-1 ${language === "ar" ? "text-right" : "text-left"}`} aria-live="polite">
                      {customReason.length}/200
                    </p>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-primary cursor-pointer flex-shrink-0"
                  aria-required="true"
                />
                <label htmlFor="terms-agreement" className={`text-sm text-slate-700 leading-relaxed cursor-pointer ${language === "ar" ? "text-right" : "text-left"}`}>
                  {language === "ar" ? (
                    <>أوافق على{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">شروط الاستخدام</Link>{" "}و{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">سياسة الخصوصية</Link></>
                  ) : language === "fr" ? (
                    <>J'accepte les{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">conditions d'utilisation</Link>{" "}et la{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">politique de confidentialité</Link></>
                  ) : (
                    <>I agree to the{" "}<Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline">terms of use</Link>{" "}and{" "}<Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline">privacy policy</Link></>
                  )}
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                aria-disabled={!canSubmit || isLoading ? "true" : "false"}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 min-h-[48px]"
              >
                {isLoading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" aria-hidden="true" />{t("loading")}</>
                ) : (
                  <><Shield className="w-5 h-5" aria-hidden="true" />{t("report.submit")}</>
                )}
              </button>

              {message && (
                <div
                  role="alert"
                  className={`p-4 rounded-xl border flex items-center gap-3 ${messageType === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
                >
                  {messageType === "success"
                    ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                    : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />}
                  <span className="font-medium text-sm">{message}</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" aria-hidden="true" />{t("report.secure")}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />{t("report.verified")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}