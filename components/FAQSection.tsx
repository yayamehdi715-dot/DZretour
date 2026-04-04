// 📁 EMPLACEMENT : components/FAQSection.tsx  (remplace l'existant)
"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Plus, Minus } from "lucide-react"

const FAQS: Record<string, { q: string; a: string }[]> = {
  ar: [
    { q: "ما هو DzRetour؟", a: "DzRetour هي منصة مجتمعية تساعد التجار في الجزائر على حماية أنفسهم من روتور عبر تبادل المعلومات حول الأرقام المشبوهة." },
    { q: "كيف يمكنني الإبلاغ عن روتور؟", a: "يمكنك الإبلاغ عن روتور بسهولة عبر إدخال رقم الهاتف وسبب روتور في صفحة الإبلاغ. العملية تستغرق أقل من دقيقة." },
    { q: "هل الخدمة مجانية؟", a: "نعم، الخدمة مجانية تماماً لجميع التجار في الجزائر. لا تسجيل ولا اشتراك." },
    { q: "كيف يُحسب مستوى الخطر؟", a: "يعتمد مستوى الخطر على عدد التقارير. من 0 إلى 1 تقرير: آمن. من 2 إلى 3: مشبوه. من 4 إلى 5: خطر محتمل. 6 وما فوق: خطير جداً." },
    { q: "هل بياناتي آمنة؟", a: "نعم. لا نجمع أي معلومات شخصية عن المستخدمين. فقط أرقام الهواتف المُبلَّغ عنها وأسباب الإبلاغ يتم حفظها." },
  ],
  fr: [
    { q: "Qu'est-ce que DzRetour ?", a: "DzRetour est une plateforme communautaire qui aide les marchands algériens à se protéger des retourneurs en partageant des informations sur les numéros suspects." },
    { q: "Comment signaler un retourneur ?", a: "Entrez simplement le numéro de téléphone et la raison du retour sur la page de signalement. Le processus prend moins d'une minute." },
    { q: "Le service est-il gratuit ?", a: "Oui, entièrement gratuit pour tous les marchands en Algérie. Aucune inscription, aucun abonnement." },
    { q: "Comment le niveau de risque est-il calculé ?", a: "Le niveau de risque est basé sur le nombre de signalements. 0–1 : sûr. 2–3 : suspect. 4–5 : probablement dangereux. 6+ : dangereux — à fuir." },
    { q: "Mes données sont-elles sécurisées ?", a: "Oui. Nous ne collectons aucune information personnelle. Seuls les numéros signalés et les raisons sont enregistrés." },
  ],
  en: [
    { q: "What is DzRetour?", a: "DzRetour is a community platform that helps merchants in Algeria protect themselves from returners by sharing information about suspicious numbers." },
    { q: "How can I report a returner?", a: "Simply enter the phone number and the return reason on the report page. The process takes less than a minute." },
    { q: "Is the service free?", a: "Yes, completely free for all merchants in Algeria. No registration, no subscription." },
    { q: "How is the risk level calculated?", a: "The risk level is based on the number of reports. 0–1: safe. 2–3: suspicious. 4–5: probably dangerous. 6+: dangerous — avoid." },
    { q: "Is my data safe?", a: "Yes. We don't collect any personal user information. Only reported phone numbers and reasons are stored." },
  ],
}

export default function FAQSection() {
  const { language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const faqs = FAQS[language] ?? FAQS.fr
  const isRtl = language === "ar"

  return (
    <section className="py-20 md:py-28 bg-gray-50/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest mb-3 block">
            {isRtl ? "الأسئلة الشائعة" : "FAQ"}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            {isRtl ? "كل ما تريد معرفته" : "Tout ce que vous devez savoir"}
          </h2>
        </div>

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
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen ? "true" : "false"}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start"
                >
                  <span className={`font-semibold text-base ${isOpen ? "text-primary" : "text-foreground"} transition-colors`}>
                    {faq.q}
                  </span>
                  <span aria-hidden="true" className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground"}`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div id={`faq-answer-${i}`} className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                  <p className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-gray-100 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center bg-white border border-border rounded-2xl p-8">
          <p className="text-muted-foreground mb-2 font-medium">
            {isRtl ? "هل لديك سؤال آخر؟" : "Vous avez d'autres questions ?"}
          </p>
          <a
            href="https://www.instagram.com/cvkdev/"
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