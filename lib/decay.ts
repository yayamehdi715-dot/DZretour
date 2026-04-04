// 📁 EMPLACEMENT : lib/decay.ts  (nouveau fichier à créer)
/**
 * Calcul du score effectif avec decay temporel.
 * Appliqué à la volée — la DB n'est jamais modifiée.
 *
 * Règles :
 *  - 0 signalement  → safe
 *  - 1 signalement  → si dernier > 3 mois → effectif = 0 (safe), sinon 1
 *  - 2+ signalements → tous les 2 mois depuis le DERNIER signalement, -1
 *                      effectif = max(0, count - floor(moisDepuisDernier / 2))
 */

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000

export function getEffectiveCount(reports: { createdAt: Date | string }[]): number {
  if (reports.length === 0) return 0

  // reports triés par createdAt asc → le dernier est le plus récent
  const lastCreatedAt = new Date(reports[reports.length - 1].createdAt)
  const monthsSinceLast = (Date.now() - lastCreatedAt.getTime()) / MS_PER_MONTH

  if (reports.length === 1) {
    return monthsSinceLast >= 3 ? 0 : 1
  }

  const decay = Math.floor(monthsSinceLast / 2)
  return Math.max(0, reports.length - decay)
}

export type RiskLevel = "safe" | "low" | "medium" | "high"

export interface RiskResult {
  level: RiskLevel
  message: string
}

/**
 * Seuils :
 *  0–1  → safe
 *  2–3  → low    (suspect)
 *  4–5  → medium (probablement dangereux)
 *  6+   → high   (dangereux — à fuir)
 */
export function getRiskFromCount(effectiveCount: number): RiskResult {
  if (effectiveCount === 0) return { level: "safe",   message: "Aucun signalement actif — numéro sûr" }
  if (effectiveCount === 1) return { level: "safe",   message: "1 signalement — peut être une erreur" }
  if (effectiveCount <= 3)  return { level: "low",    message: "Suspect — signalé plusieurs fois" }
  if (effectiveCount <= 5)  return { level: "medium", message: "Probablement dangereux — soyez prudent" }
  return                           { level: "high",   message: "Dangereux — À fuir" }
}