import { type NextRequest, NextResponse } from "next/server"
import { normalizePhone, isValidPhone, hashPhone } from "@/lib/phone"
import { createRateLimiter } from "@/lib/rateLimit"
import { getEffectiveCount, getRiskFromCount } from "@/lib/decay"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const checkLimit = createRateLimiter()

/**
 * Extrait et valide l'IP cliente depuis les headers.
 */
function extractIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const raw = (forwardedFor?.split(",")[0] ?? realIp ?? "").trim()
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^[0-9a-fA-F:]{2,39}$/
  if (ipv4.test(raw) || ipv6.test(raw)) return raw
  return "unknown"
}

export async function POST(request: NextRequest) {
  try {
    const ip = extractIP(request)

    // Rate limit : 100 vérifications / heure / IP
    const rateLimit = checkLimit(ip, 60 * 60 * 1000, 100)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard.", code: "RATE_LIMITED_CHECK", resetTime: rateLimit.resetTime },
        { status: 429 }
      )
    }

    let body: { phone?: unknown }
    try { body = await request.json() }
    catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

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

    interface ReportDoc { reason: string; customReason?: string | null; createdAt: Date | string }

    // Requête compatible anciens (phoneNumber) et nouveaux (phoneHash) documents
    const phoneHash = hashPhone(normalizedPhone)
    const phoneFilter = phoneHash
      ? { $or: [{ phoneHash }, { phoneNumber: normalizedPhone }] }
      : { phoneNumber: normalizedPhone }

    const [reports] = await Promise.all([
      db.collection<ReportDoc>("reports")
        .find(phoneFilter)
        .sort({ createdAt: 1 })
        .project<ReportDoc>({ reason: 1, customReason: 1, createdAt: 1, _id: 0 })
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
    const reasonTypes = Array.from(new Set(reports.map(r => r.reason as string))).slice(0, 3)

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
