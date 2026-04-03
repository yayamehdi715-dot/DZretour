"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Plus, Minus } from "lucide-react"

const FAQS = {
  ar: [
    {
      q: "ما هو DzRetour؟",
      a: "DzRetour هي منصة مجتمعية تساعد التجار في الجزائر على حماية أنفسهم من روتور عبر تبادل المعلومات حول الأرقام المشبوهة.",
    },
    {
      q: "كيف يمكنني الإبلاغ عن روتور؟",
      a: "يمكنك الإبلاغ عن روتور بسهولة عبر إدخال رقم الهاتف وسبب روتور في صفحة الإبلاغ. العملية تستغرق أقل من دقيقة.",
    },
    {
      q: "هل الخدمة مجانية؟",
      a: "نعم، الخدمة مجانية تماماً لجميع التجار في الجزائر. لا تسجيل ولا اشتراك.",
    },
    {
      q: "كيف يُحسب مستوى الخطر؟",
      a: "يعتمد مستوى الخطر على عدد التقارير وتاريخها. التقارير الحديثة تؤثر أكثر من القديمة. المستويات: آمن، منخفض، متوسط، مرتفع.",
    },
    {
      q: "هل بياناتي آمنة؟",
      a: "نعم. لا نجمع أي معلومات شخصية عن المستخدمين. فقط أرقام الهواتف المُبلَّغ عنها وأسباب الإبلاغ يتم حفظها.",
    },
  ],
  en: [
    {
      q: "What is DzRetour?",
      a: "DzRetour is a community platform that helps merchants in Algeria protect themselves from returners by sharing information about suspicious numbers.",
    },
    {
      q: "How can I report a returner?",
      a: "Simply enter the phone number and the return reason on the report page. The process takes less than a minute.",
    },
    {
      q: "Is the service free?",
      a: "Yes, completely free for all merchants in Algeria. No registration, no subscription.",
    },
    {
      q: "How is the risk level calculated?",
      a: "The risk level is based on the number and recency of reports. Recent reports carry more weight. Levels: safe, low, medium, high.",
    },
    {
      q: "Is my data safe?",
      a: "Yes. We don't collect any personal user information. Only reported phone numbers and reasons are stored.",
    },
  ],
}

export default function FAQSection() {
  const { language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const faqs = FAQS[language] ?? FAQS.en
  const isRtl = language === "ar"

  return (
    <section className="py-20 md:py-28 bg-gray-50/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest mb-3 block">
            {isRtl ? "الأسئلة الشائعة" : "FAQ"}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            {isRtl ? "كل ما تريد معرفته" : "Tout ce que vous devez savoir"}
          </h2>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className={`bg-white border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? "border-primary/30 shadow-md" : "border-transparent shadow-sm hover:border-border"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start"
                >
                  <span className={`font-semibold text-base ${isOpen ? "text-primary" : "text-foreground"} transition-colors`}>
                    {faq.q}
                  </span>
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground"
                  }`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                  <p className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-gray-100 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center bg-white border border-border rounded-2xl p-8">
          <p className="text-muted-foreground mb-2 font-medium">
            {isRtl ? "هل لديك سؤال آخر؟" : "Vous avez d'autres questions ?"}
          </p>
          <a
            href="https://www.instagram.com/dz.retour/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            {isRtl ? "تواصل معنا عبر Instagram" : "Contactez-nous sur Instagram"}
          </a>
        </div>
      </div>
    </section>
  )
}