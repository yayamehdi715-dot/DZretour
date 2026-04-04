// 📁 EMPLACEMENT : app/api/report/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"
import { normalizePhone, isValidPhone, sanitizeString } from "@/lib/phone"
import { createRateLimiter } from "@/lib/rateLimit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const reportLimit = createRateLimiter()

// Liste blanche des raisons valides (toutes les langues)
const VALID_REASONS = new Set([
  "Product dissatisfaction", "Refused to open package",
  "Package damaged during delivery", "Customer changed mind", "Other",
  "عدم الرضا عن المنتج", "رفض فتح الطرد",
  "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى",
  "Insatisfaction produit", "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison", "Changement d'avis du client", "Autre",
])

async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string; timezone?: string }> {
  // Ne pas lookup les IP locales / inconnues
  if (!ip || ip === "unknown" || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) {
    return {}
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      headers: { "User-Agent": "DzRetour/1.0" },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error) return {}
    return {
      country:  data.country_code  ?? null,
      city:     data.city          ?? null,
      timezone: data.timezone      ?? null,
    }
  } catch {
    // Fallback silencieux — la géolocalisation est non-critique
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = (forwardedFor?.split(",")[0] ?? realIp ?? "unknown").trim()
    const userAgent = request.headers.get("user-agent") ?? null

    // Rate limit : 3 signalements / heure / IP
    const rl = reportLimit(ip, 60 * 60 * 1000, 3)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de signalements. Réessayez plus tard.", code: "RATE_LIMITED", resetTime: rl.resetTime },
        { status: 429 }
      )
    }

    // Parse
    let body: { phone?: unknown; reason?: unknown; customReason?: unknown }
    try { body = await request.json() }
    catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

    // Validation de type stricte
    if (typeof body.phone !== "string" || typeof body.reason !== "string") {
      return NextResponse.json({ error: "Numéro et raison requis", code: "MISSING_FIELDS" }, { status: 400 })
    }

    const cleanPhone = normalizePhone(body.phone)
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json({ error: "Format de numéro algérien invalide", code: "INVALID_PHONE" }, { status: 400 })
    }

    const reason = body.reason.trim()
    if (!VALID_REASONS.has(reason)) {
      return NextResponse.json({ error: "Raison invalide", code: "INVALID_REASON" }, { status: 400 })
    }

    // Sanitize customReason
    const customReason = typeof body.customReason === "string"
      ? sanitizeString(body.customReason, 200).trim() || null
      : null

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()
    const col = db.collection("reports")

    // Anti-doublon : même numéro dans les 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentReport = await col.findOne(
      { phoneNumber: cleanPhone, createdAt: { $gte: twentyFourHoursAgo } },
      { projection: { createdAt: 1, _id: 0 } }
    )
    if (recentReport) {
      return NextResponse.json(
        { error: "Ce numéro a déjà été signalé récemment", code: "DUPLICATE_REPORT", lastReported: recentReport.createdAt },
        { status: 409 }
      )
    }

    // Géoloc en parallèle avec l'insert pour ne pas bloquer
    const [locationData, result] = await Promise.all([
      getLocationFromIP(ip),
      col.insertOne({
        phoneNumber: cleanPhone,
        reason,
        customReason,
        reporterIp: ip !== "unknown" ? ip : null,
        reporterUserAgent: userAgent ? sanitizeString(userAgent, 500) : null,
        reporterCountry: null,  // sera mis à jour après géoloc
        reporterCity: null,
        reporterTimezone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ])

    // Mise à jour asynchrone de la géoloc (non-bloquante pour la réponse)
    if (locationData.country) {
      col.updateOne(
        { _id: result.insertedId },
        { $set: {
          reporterCountry:  locationData.country  ?? null,
          reporterCity:     locationData.city     ?? null,
          reporterTimezone: locationData.timezone ?? null,
          updatedAt: new Date(),
        }}
      ).catch(err => console.error("[report] Geoloc update failed:", err))
    }

    // Stats globales
    db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: 1 }, $set: { lastUpdated: new Date() } },
      { upsert: true }
    ).catch(err => console.error("[report] Stats update failed:", err))

    return NextResponse.json(
      { message: "Signalement soumis avec succès", id: result.insertedId.toString() },
      { status: 201 }
    )
  } catch (error) {
    console.error("[report] Error:", error)
    return NextResponse.json({ error: "Erreur interne", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}