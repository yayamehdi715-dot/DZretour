import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const checkRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, windowMs: number, maxRequests: number): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now()
  const current = checkRateLimitMap.get(key)
  if (!current || now > current.resetTime) {
    checkRateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime, remaining: 0 }
  }
  current.count++
  return { allowed: true, remaining: maxRequests - current.count }
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "")
  if (cleaned.startsWith("+213")) cleaned = "0" + cleaned.substring(4)
  else if (cleaned.startsWith("00213")) cleaned = "0" + cleaned.substring(5)
  else if (cleaned.startsWith("213")) cleaned = "0" + cleaned.substring(3)
  else if (cleaned.match(/^[567]\d{8}$/)) cleaned = "0" + cleaned
  return cleaned
}

/**
 * Risk scoring based on report count:
 * 0-1  → safe
 * 2-3  → low   (suspect)
 * 4-5  → medium (probably dangerous)
 * 6+   → high  (dangerous — avoid)
 */
function calculateRisk(reportCount: number): {
  level: "safe" | "low" | "medium" | "high"
  message: string
} {
  if (reportCount <= 1) return { level: "safe", score: reportCount } as any
  if (reportCount <= 3) return { level: "low", message: "Suspect — quelques signalements" } as any
  if (reportCount <= 5) return { level: "medium", message: "Probablement dangereux" } as any
  return { level: "high", message: "Dangereux — À fuir" } as any
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown"

    const rateLimit = checkRateLimit(ip, 60 * 60 * 1000, 100)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many check requests. Please try again later.", code: "RATE_LIMITED_CHECK", resetTime: rateLimit.resetTime },
        { status: 429 }
      )
    }

    let body: { phone?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body", code: "INVALID_JSON" }, { status: 400 })
    }

    const { phone } = body
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required", code: "MISSING_PHONE" }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const phoneRegex = /^0[567]\d{8}$/
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error: "Invalid Algerian mobile phone number format. Expected format: 0XXXXXXXXX",
          code: "INVALID_PHONE",
          ...(process.env.NODE_ENV === "development" && { debug: { input: phone, normalized: normalizedPhone } }),
        },
        { status: 400 }
      )
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    const reports = await db
      .collection("reports")
      .find({ phoneNumber: normalizedPhone })
      .sort({ createdAt: 1 })
      .project({ reason: 1, customReason: 1, createdAt: 1 })
      .toArray()

    const count = reports.length
    const firstReport = reports[0]
    const daysSinceFirst = firstReport
      ? Math.floor((Date.now() - new Date(firstReport.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // New count-based risk scoring
    let riskLevel: "safe" | "low" | "medium" | "high"
    let riskMessage: string

    if (count === 0) {
      riskLevel = "safe"
      riskMessage = "Aucun signalement — numéro sûr"
    } else if (count === 1) {
      riskLevel = "safe"
      riskMessage = "1 signalement — peut être une erreur"
    } else if (count <= 3) {
      riskLevel = "low"
      riskMessage = "Suspect — signalé plusieurs fois"
    } else if (count <= 5) {
      riskLevel = "medium"
      riskMessage = "Probablement dangereux — soyez prudent"
    } else {
      riskLevel = "high"
      riskMessage = "Dangereux — À fuir"
    }

    const recentReports = reports.filter(
      (r) => Date.now() - new Date(r.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    )
    const reasonTypes = Array.from(new Set(reports.map((r) => r.reason))).slice(0, 3)
    const hasCustomReasons = reports.some((r) => r.customReason)

    console.log(`Phone check from IP: ${ip}, Risk: ${riskLevel}, Reports: ${count}`)

    return NextResponse.json({
      isReported: count > 0,
      reportCount: count,
      risk: {
        level: riskLevel,
        message: riskMessage,
      },
      patterns: count > 0 ? {
        reasonTypes,
        hasCustomReasons,
        reportedRecently: recentReports.length > 0,
        reportingTimespan: firstReport ? {
          first:
            daysSinceFirst > 365 ? "over a year ago"
            : daysSinceFirst > 30 ? "over a month ago"
            : daysSinceFirst > 7 ? "over a week ago"
            : "recently",
        } : null,
      } : null,
      metadata: {
        checkedAt: new Date().toISOString(),
        remaining: rateLimit.remaining,
      },
    })
  } catch (error) {
    console.error("Error checking phone number:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}