import { timingSafeEqual } from "crypto"

/**
 * Comparaison de chaînes en temps constant — protège contre les timing attacks.
 * Utilise crypto.timingSafeEqual (Node.js built-in, runtime = "nodejs").
 * Effectue une comparaison factice même quand les longueurs diffèrent pour
 * éviter les attaques par oracle de longueur.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8")
  const bufB = Buffer.from(b, "utf8")
  if (bufA.length !== bufB.length) {
    // Comparaison factice en temps constant pour éviter le leak de longueur
    timingSafeEqual(bufA, Buffer.alloc(bufA.length))
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return false
  if (!username || !password) return false
  const validUser = safeCompare(username, process.env.ADMIN_USER)
  const validPass = safeCompare(password, process.env.ADMIN_PASSWORD)
  return validUser && validPass
}

export function checkEnvVars(): string | null {
  if (!process.env.ADMIN_USER)     return "ADMIN_USER non défini"
  if (!process.env.ADMIN_PASSWORD) return "ADMIN_PASSWORD non défini"
  if (!process.env.MONGODB_URI)    return "MONGODB_URI non défini"
  return null
}
