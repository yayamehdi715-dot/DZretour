// 📁 EMPLACEMENT : lib/auth.ts  (remplace l'existant)

/**
 * Comparaison de chaînes en temps constant — évite les timing attacks.
 * N'utilise PAS crypto Node.js pour éviter les erreurs d'import Next.js.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
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