// 📁 EMPLACEMENT : app/api/report/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"
import { normalizePhone, isValidPhone, sanitizeString } from "@/lib/phone"
import { createRateLimiter } from "@/lib/rateLimit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const reportLimit = createRateLimiter()

// Toutes les raisons valides — anciennes + nouvelles labels publiques
const VALID_REASONS = new Set([
  // Nouvelles raisons publiques (FR)
  "Insatisfaction client",
  "Changement d'avis client",
  "Sans raison valable",
  "Autre",
  // Anciennes raisons FR (compatibilité signalements existants)
  "Insatisfaction produit",
  "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison",
  "Changement d'avis du client",
  // Raisons AR
  "عدم الرضا عن المنتج", "رفض فتح الطرد",
  "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى",
  "عدم رضا العميل", "تغيير رأي العميل", "بدون سبب وجيه",
  // Raisons EN
  "Product dissatisfaction", "Refused to open package",
  "Package damaged during delivery", "Customer changed mind", "Other",
  "Customer dissatisfaction", "No valid reason",
])

async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string; timezone?: string }> {
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
    return { country: data.country_code ?? null, city: data.city ?? null, timezone: data.timezone ?? null }
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = (forwardedFor?.split(",")[0] ?? realIp ?? "unknown").trim()
    const userAgent = request.headers.get("user-agent") ?? null

    const rl = reportLimit(ip, 60 * 60 * 1000, 3)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de signalements. Réessayez plus tard.", code: "RATE_LIMITED", resetTime: rl.resetTime },
        { status: 429 }
      )
    }

    let body: { phone?: unknown; reason?: unknown; customReason?: unknown }
    try { body = await request.json() }
    catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

    if (typeof body.phone !== "string") {
      return NextResponse.json({ error: "Numéro requis", code: "MISSING_FIELDS" }, { status: 400 })
    }

    const cleanPhone = normalizePhone(body.phone)
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json({ error: "Format de numéro algérien invalide", code: "INVALID_PHONE" }, { status: 400 })
    }

    // La raison est optionnelle — on met "Non spécifiée" si absent
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "Non spécifiée"

    if (reason !== "Non spécifiée" && !VALID_REASONS.has(reason)) {
      return NextResponse.json({ error: "Raison invalide", code: "INVALID_REASON" }, { status: 400 })
    }

    const customReason = typeof body.customReason === "string"
      ? sanitizeString(body.customReason, 200).trim() || null
      : null

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()
    const col = db.collection("reports")

    // Anti-doublon : même IP + même numéro dans les 3 jours
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const recentByThisIP = await col.findOne(
      { phoneNumber: cleanPhone, reporterIp: ip !== "unknown" ? ip : "__never__", createdAt: { $gte: threeDaysAgo } },
      { projection: { createdAt: 1, _id: 0 } }
    )
    if (recentByThisIP) {
      return NextResponse.json(
        { error: "Vous avez déjà signalé ce numéro récemment. Réessayez dans 3 jours.", code: "DUPLICATE_REPORT", lastReported: recentByThisIP.createdAt },
        { status: 409 }
      )
    }

    const now = new Date()
    const result = await col.insertOne({
      phoneNumber: cleanPhone,
      reason,
      customReason,
      reporterIp: ip !== "unknown" ? ip : null,
      reporterUserAgent: userAgent ? sanitizeString(userAgent, 500) : null,
      reporterCountry: null,
      reporterCity: null,
      reporterTimezone: null,
      createdAt: now,
      updatedAt: now,
    })

    getLocationFromIP(ip).then(loc => {
      if (loc.country) {
        col.updateOne(
          { _id: result.insertedId },
          { $set: { reporterCountry: loc.country, reporterCity: loc.city ?? null, reporterTimezone: loc.timezone ?? null, updatedAt: new Date() } }
        ).catch(() => {})
      }
    })

    db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: 1 }, $set: { lastUpdated: now } },
      { upsert: true }
    ).catch(() => {})

    return NextResponse.json(
      { message: "Signalement soumis avec succès", id: result.insertedId.toString() },
      { status: 201 }
    )
  } catch (error) {
    console.error("[report] Error:", error)
    return NextResponse.json({ error: "Erreur interne", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}