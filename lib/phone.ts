// 📁 EMPLACEMENT : lib/phone.ts  (nouveau fichier à créer)
/**
 * Shared phone number utilities — used by all API routes.
 * Single source of truth for normalization and validation.
 */

const PHONE_REGEX = /^0[567]\d{8}$/

/**
 * Normalise un numéro algérien vers le format local 0XXXXXXXXX.
 * Gère : +213, 00213, 213, 05/06/07 sans préfixe.
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, "")

  if (cleaned.startsWith("+213")) {
    cleaned = "0" + cleaned.substring(4)
  } else if (cleaned.startsWith("00213")) {
    cleaned = "0" + cleaned.substring(5)
  } else if (cleaned.startsWith("213") && cleaned.length === 12) {
    cleaned = "0" + cleaned.substring(3)
  } else if (/^[567]\d{8}$/.test(cleaned)) {
    cleaned = "0" + cleaned
  }

  return cleaned
}

/**
 * Valide un numéro algérien mobile normalisé.
 * Format attendu : 0[567]XXXXXXXX (10 chiffres)
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone)
}

/**
 * Échappe les caractères spéciaux pour éviter toute injection regex.
 */
export function sanitizeString(str: string, maxLen = 500): string {
  return str.slice(0, maxLen).replace(/[\x00-\x1F\x7F]/g, "")
}