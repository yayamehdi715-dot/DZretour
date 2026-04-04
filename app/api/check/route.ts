// 📁 EMPLACEMENT : app/api/check/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"
import { normalizePhone, isValidPhone } from "@/lib/phone"
import { createRateLimiter } from "@/lib/rateLimit"
import { getEffectiveCount, getRiskFromCount } from "@/lib/decay"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const checkLimit = createRateLimiter()

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = (forwardedFor?.split(",")[0] ?? realIp ?? "unknown").trim()

    // Rate limit : 100 vérifications / heure / IP
    const rateLimit = checkLimit(ip, 60 * 60 * 1000, 100)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard.", code: "RATE_LIMITED_CHECK", resetTime: rateLimit.resetTime },
        { status: 429 }
      )
    }

    // Parse du body
    let body: { phone?: unknown }
    try { body = await request.json() }
    catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

    // Validation de type
    if (typeof body.phone !== "string" || !body.phone.trim()) {
      return NextResponse.json({ error: "Numéro de téléphone requis", code: "MISSING_PHONE" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(body.phone)
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "Format invalide. Attendu : 0[5-7]XXXXXXXX", code: "INVALID_PHONE" },
        { status: 400 }
      )
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    // Récupération des signalements + incrément compteur en parallèle
    const [reports] = await Promise.all([
      db.collection("reports")
        .find({ phoneNumber: normalizedPhone })
        .sort({ createdAt: 1 })
        .project({ reason: 1, customReason: 1, createdAt: 1, _id: 0 })
        .toArray(),
      db.collection("app_stats").updateOne(
        { _id: "global" as any },
        { $inc: { totalChecks: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
      ),
    ])

    const rawCount = reports.length
    const effectiveCount = getEffectiveCount(reports)
    const { level: riskLevel, message: riskMessage } = getRiskFromCount(effectiveCount)

    const now = Date.now()
    const firstReport = reports[0]
    const daysSinceFirst = firstReport
      ? Math.floor((now - new Date(firstReport.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const recentReports = reports.filter(
      r => now - new Date(r.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    )
    const reasonTypes = [...new Set(reports.map(r => r.reason as string))].slice(0, 3)

    return NextResponse.json({
      isReported: effectiveCount > 0,
      reportCount: effectiveCount,
      rawReportCount: rawCount,
      risk: { level: riskLevel, message: riskMessage },
      patterns: rawCount > 0 ? {
        reasonTypes,
        hasCustomReasons: reports.some(r => Boolean(r.customReason)),
        reportedRecently: recentReports.length > 0,
        reportingTimespan: firstReport ? {
          first: daysSinceFirst > 365 ? "over a year ago"
               : daysSinceFirst > 30  ? "over a month ago"
               : daysSinceFirst > 7   ? "over a week ago"
               : "recently",
        } : null,
      } : null,
      metadata: { checkedAt: new Date().toISOString(), remaining: rateLimit.remaining },
    })
  } catch (error) {
    console.error("[check] Error:", error)
    return NextResponse.json({ error: "Erreur interne", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}