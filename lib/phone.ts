import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto"

/**
 * Shared phone number utilities — used by all API routes.
 * Single source of truth for normalization, validation, masking and encryption.
 *
 * PHONE_SECRET (variable d'env) active le chiffrement :
 *   - hashPhone()    → HMAC-SHA256 pour la recherche (non réversible)
 *   - encryptPhone() → AES-256-GCM pour le stockage (réversible avec la clé)
 *   - decryptPhone() → déchiffrement AES-256-GCM
 * Sans PHONE_SECRET, ces fonctions retournent null (fallback texte clair).
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
 * Masque un numéro pour affichage admin : 0555123456 → 0555****56
 * Ne révèle que l'opérateur (4 chiffres) et les 2 derniers chiffres.
 */
export function maskPhone(p: string): string {
  if (!p || p.length < 6) return "****"
  return p.substring(0, 4) + "****" + p.substring(p.length - 2)
}

/**
 * Échappe les caractères de contrôle pour éviter toute injection.
 */
export function sanitizeString(str: string, maxLen = 500): string {
  return str.slice(0, maxLen).replace(/[\x00-\x1F\x7F]/g, "")
}

// ─── Chiffrement des numéros (nécessite PHONE_SECRET) ────────────────────────

function getPhoneSecret(): string | null {
  return process.env.PHONE_SECRET || null
}

function deriveKey(secret: string, purpose: string): Buffer {
  // Dérive une clé AES-256 (32 octets) à partir du secret et du contexte
  return createHmac("sha256", purpose).update(secret).digest()
}

/**
 * Calcule HMAC-SHA256 du numéro normalisé → clé de recherche opaque.
 * Non réversible. Retourne null si PHONE_SECRET n'est pas défini.
 */
export function hashPhone(normalizedPhone: string): string | null {
  const secret = getPhoneSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(normalizedPhone).digest("hex")
}

/**
 * Chiffre le numéro en AES-256-GCM → stockage sécurisé dans MongoDB.
 * Format : base64(iv[12] + tag[16] + ciphertext)
 * Retourne null si PHONE_SECRET n'est pas défini.
 */
export function encryptPhone(normalizedPhone: string): string | null {
  const secret = getPhoneSecret()
  if (!secret) return null
  const key = deriveKey(secret, "dzr-phone-enc-v1")
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(normalizedPhone, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

/**
 * Déchiffre un numéro chiffré par encryptPhone().
 * Retourne null si PHONE_SECRET n'est pas défini ou si le déchiffrement échoue.
 */
export function decryptPhone(encryptedB64: string): string | null {
  const secret = getPhoneSecret()
  if (!secret) return null
  try {
    const buf = Buffer.from(encryptedB64, "base64")
    if (buf.length < 28) return null // iv(12) + tag(16) minimum
    const iv  = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const key = deriveKey(secret, "dzr-phone-enc-v1")
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(data).toString("utf8") + decipher.final("utf8")
  } catch {
    return null
  }
}
