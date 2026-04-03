import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Rate limiting map (use Redis in production)
const checkRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; resetTime?: number; remaining?: number } {
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

  if (cleaned.startsWith("+213")) {
    cleaned = "0" + cleaned.substring(4)
  } else if (cleaned.startsWith("00213")) {
    cleaned = "0" + cleaned.substring(5)
  } else if (cleaned.startsWith("213")) {
    cleaned = "0" + cleaned.substring(3)
  } else if (cleaned.match(/^[567]\d{8}$/)) {
    cleaned = "0" + cleaned
  }

  return cleaned
}

// POST endpoint for checking phone numbers
export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown"

    // Rate limiting: 100 checks per hour per IP
    const rateLimit = checkRateLimit(ip, 60 * 60 * 1000, 100)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many check requests. Please try again later.",
          code: "RATE_LIMITED_CHECK",
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
    }

    let body: { phone?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_JSON" },
        { status: 400 }
      )
    }

    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required", code: "MISSING_PHONE" },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const phoneRegex = /^0[567]\d{8}$/

    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error: "Invalid Algerian mobile phone number format. Expected format: 0XXXXXXXXX",
          code: "INVALID_PHONE",
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              input: phone,
              normalized: normalizedPhone,
              expected: "0XXXXXXXXX (where second digit is 5, 6, or 7)",
            },
          }),
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

    const firstReport = reports[0]
    const daysSinceFirst = firstReport
      ? Math.floor(
          (Date.now() - new Date(firstReport.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

    // Risk score with time decay
    const now = Date.now()
    let totalScore = 0

    reports.forEach((report) => {
      const daysOld = Math.floor(
        (now - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      let reportScore = 15
      if (daysOld <= 7) reportScore = 15
      else if (daysOld <= 30) reportScore = 12
      else if (daysOld <= 90) reportScore = 9
      else if (daysOld <= 180) reportScore = 6
      else if (daysOld <= 365) reportScore = 3
      else reportScore = 1.5
      totalScore += reportScore
    })

    const recentReports = reports.filter(
      (r) => now - new Date(r.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    )
    if (recentReports.length > 0) {
      totalScore += Math.min(recentReports.length * 5, 20)
    }

    const reportsPerDay = reports.length / Math.max(daysSinceFirst, 1)
    if (reportsPerDay > 0.5) totalScore += 10
    else if (reportsPerDay > 0.1) totalScore += 3

    const riskLevel: "safe" | "low" | "medium" | "high" =
      reports.length === 0
        ? "safe"
        : totalScore < 15
        ? "low"
        : totalScore < 35
        ? "medium"
        : "high"

    const riskMessage =
      riskLevel === "safe"
        ? "No reports found"
        : riskLevel === "low"
        ? "Low risk detected"
        : riskLevel === "medium"
        ? "Moderate risk - exercise caution"
        : "High risk - proceed with extreme caution"

    const reasonTypes = Array.from(new Set(reports.map((r) => r.reason))).slice(0, 3)
    const hasCustomReasons = reports.some((r) => r.customReason)

    console.log(
      `Phone check from IP: ${ip}, Risk: ${riskLevel}, Reports: ${reports.length}`
    )

    return NextResponse.json({
      isReported: reports.length > 0,
      risk: {
        level: riskLevel,
        message: riskMessage,
        ...(process.env.NODE_ENV === "development" && {
          score: Math.round(totalScore * 10) / 10,
        }),
      },
      patterns:
        reports.length > 0
          ? {
              reasonTypes,
              hasCustomReasons,
              reportedRecently: recentReports.length > 0,
              reportingTimespan: firstReport
                ? {
                    first:
                      daysSinceFirst > 365
                        ? "over a year ago"
                        : daysSinceFirst > 30
                        ? "over a month ago"
                        : daysSinceFirst > 7
                        ? "over a week ago"
                        : "recently",
                  }
                : null,
            }
          : null,
      metadata: {
        checkedAt: new Date().toISOString(),
        remaining: rateLimit.remaining,
      },
    })
  } catch (error) {
    console.error("Error checking phone number:", error)
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}