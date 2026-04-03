import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ReportRequest {
  phone: string
  reason: string
  customReason?: string
}

// Rate limiting maps (use Redis in production)
const reportRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now()
  const current = reportRateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    reportRateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime, remaining: 0 }
  }

  current.count++
  return { allowed: true, remaining: maxRequests - current.count }
}

// Helper function to get location data from IP
async function getLocationFromIP(ip: string): Promise<{
  country?: string
  city?: string
  timezone?: string
}> {
  try {
    if (
      ip === "unknown" ||
      ip.startsWith("127.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return {}
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReportBot/1.0)" },
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    if (data.error) return {}

    return {
      country: data.country_code || null,
      city: data.city || null,
      timezone: data.timezone || null,
    }
  } catch {
    try {
      const fallback = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,countryCode,city,timezone`
      )
      const fallbackData = await fallback.json()
      if (fallbackData.status === "success") {
        return {
          country: fallbackData.countryCode || null,
          city: fallbackData.city || null,
          timezone: fallbackData.timezone || null,
        }
      }
    } catch {}
  }

  return {}
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown"
    const userAgent = request.headers.get("user-agent") || null

    // Rate limiting: 3 reports per hour per IP
    const rateLimitResult = checkRateLimit(ip, 60 * 60 * 1000, 3)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many reports. Please try again later.",
          code: "RATE_LIMITED",
          resetTime: rateLimitResult.resetTime,
        },
        { status: 429 }
      )
    }

    let body: ReportRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_JSON" },
        { status: 400 }
      )
    }

    if (!body.phone || !body.reason) {
      return NextResponse.json(
        { error: "Phone number and reason are required", code: "MISSING_FIELDS" },
        { status: 400 }
      )
    }

    const cleanPhone = body.phone.replace(/\s/g, "")
    const phoneRegex = /^(\+213|0)[5-7]\d{8}$/

    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid Algerian phone number format", code: "INVALID_PHONE" },
        { status: 400 }
      )
    }

    const validReasons = [
      "Product dissatisfaction",
      "Refused to open package",
      "Package damaged during delivery",
      "Customer changed mind",
      "Other",
      "عدم الرضا عن المنتج",
      "رفض فتح الطرد",
      "تلف الطرد أثناء التوصيل",
      "تغيير رأي العميل",
      "أخرى",
    ]

    if (!validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: "Invalid reason provided", code: "INVALID_REASON" },
        { status: 400 }
      )
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()
    const reportsCollection = db.collection("reports")
    const statsCollection = db.collection("report_stats")

    // Check for recent duplicate (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentReport = await reportsCollection.findOne({
      phoneNumber: cleanPhone,
      createdAt: { $gte: twentyFourHoursAgo },
    })

    if (recentReport) {
      return NextResponse.json(
        {
          error: "This phone number has already been reported recently",
          code: "DUPLICATE_REPORT",
          lastReported: recentReport.createdAt,
        },
        { status: 409 }
      )
    }

    const locationData = await getLocationFromIP(ip)

    const now = new Date()
    const result = await reportsCollection.insertOne({
      phoneNumber: cleanPhone,
      reason: body.reason,
      customReason: body.customReason || null,
      reporterIp: ip !== "unknown" ? ip : null,
      reporterUserAgent: userAgent,
      reporterCountry: locationData.country || null,
      reporterCity: locationData.city || null,
      reporterTimezone: locationData.timezone || null,
      createdAt: now,
      updatedAt: now,
    })

    // Update global stats (upsert)
    await statsCollection.updateOne(
      { _id: "global" as any },
      {
        $inc: { totalReports: 1 },
        $set: { lastUpdated: now },
      },
      { upsert: true }
    )

    return NextResponse.json(
      {
        message: "Report submitted successfully",
        id: result.insertedId.toString(),
        timestamp: now,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error processing report:", error)
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}

// GET endpoint for checking phone numbers
export async function GET(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown"

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required", code: "MISSING_PHONE" },
        { status: 400 }
      )
    }

    const cleanPhone = phone.replace(/\s/g, "")
    const phoneRegex = /^(\+213|0)[5-7]\d{8}$/

    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format", code: "INVALID_PHONE" },
        { status: 400 }
      )
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    const reports = await db
      .collection("reports")
      .find({ phoneNumber: cleanPhone })
      .sort({ createdAt: 1 })
      .project({ reason: 1, customReason: 1, createdAt: 1, reporterCountry: 1, reporterCity: 1 })
      .toArray()

    const firstReport = reports[0]
    const daysSinceFirst = firstReport
      ? Math.floor((Date.now() - new Date(firstReport.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Risk score with time decay
    let totalScore = 0
    const now = Date.now()
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

    const riskLevel =
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
    const countries = new Set(reports.map((r) => r.reporterCountry).filter(Boolean))

    return NextResponse.json({
      isReported: reports.length > 0,
      reportCount: reports.length,
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
              firstReportDate: firstReport ? firstReport.createdAt : null,
              daysSinceFirstReport: daysSinceFirst,
              geographicDiversity: {
                countriesCount: countries.size,
                countries: Array.from(countries),
              },
            }
          : null,
      reports: reports.map((r) => ({
        reason: r.reason,
        customReason: r.customReason,
        createdAt: r.createdAt,
        country: r.reporterCountry,
        city: r.reporterCity,
      })),
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking phone number:", error)
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}