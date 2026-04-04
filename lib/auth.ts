// 📁 EMPLACEMENT : lib/auth.ts  (nouveau fichier à créer)
/**
 * Vérification des credentials admin.
 * Utilise une comparaison en temps constant pour éviter les timing attacks.
 */

import { timingSafeEqual } from "crypto"

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    // timingSafeEqual exige des buffers de même longueur
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return false
  if (!username || !password) return false

  const validUser = safeCompare(username, process.env.ADMIN_USER)
  const validPass = safeCompare(password, process.env.ADMIN_PASSWORD)

  // Les deux doivent être vrais (pas de court-circuit pour éviter les timing attacks)
  return validUser && validPass
}

export function checkEnvVars(): string | null {
  if (!process.env.ADMIN_USER)     return "ADMIN_USER non défini"
  if (!process.env.ADMIN_PASSWORD) return "ADMIN_PASSWORD non défini"
  if (!process.env.MONGODB_URI)    return "MONGODB_URI non défini"
  return null
}