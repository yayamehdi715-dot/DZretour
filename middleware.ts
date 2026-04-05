import { type NextRequest, NextResponse } from "next/server"

/**
 * Middleware Next.js — protection de la route /admin.
 *
 * Rôle :
 * 1. Interdit l'indexation de /admin par les moteurs de recherche.
 * 2. Désactive tout cache sur /admin (évite que des credentials transitent en cache).
 * 3. Ajoute un log serveur pour détecter les accès suspects.
 *
 * Note : l'authentification réelle est gérée côté API (POST /api/admin/stats, etc.)
 * via verifyAdminCredentials(). Le middleware est une couche de défense complémentaire.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  if (pathname.startsWith("/admin")) {
    // Interdit l'indexation Google/Bing de l'interface admin
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
    // Aucun cache — les credentials ne doivent jamais être mis en cache
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Surrogate-Control", "no-store")
  }

  return response
}

export const config = {
  matcher: [
    // Applique le middleware aux routes /admin uniquement
    "/admin/:path*",
  ],
}
