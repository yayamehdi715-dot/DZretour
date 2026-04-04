// 📁 EMPLACEMENT : lib/rateLimit.ts  (nouveau fichier à créer)
/**
 * In-memory rate limiter.
 * Note : non-persisté entre les instances Serverless.
 * Pour la production haute charge, remplacer par Redis (Upstash).
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime?: number
}

export function createRateLimiter() {
  const store = new Map<string, RateLimitEntry>()

  // Nettoyage périodique pour éviter les fuites mémoire
  const cleanup = () => {
    const now = Date.now()
    const keys = Array.from(store.keys())
    keys.forEach(key => {
      const entry = store.get(key)
      if (entry && now > entry.resetTime) store.delete(key)
    })
  }
  // Nettoyage toutes les 5 minutes
  if (typeof setInterval !== "undefined") {
    setInterval(cleanup, 5 * 60 * 1000)
  }

  return function checkLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): RateLimitResult {
    const now = Date.now()
    const current = store.get(key)

    if (!current || now > current.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1 }
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    return { allowed: true, remaining: maxRequests - current.count }
  }
}