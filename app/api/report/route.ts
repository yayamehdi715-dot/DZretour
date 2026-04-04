import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ReportRequest {
  phone: string
  reason: string
  customReason?: string
}

const reportRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, windowMs: number, maxRequests: number): { allowed: boolean; resetTime?: number; remaining?: number } {
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

async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string; timezone?: string }> {
  try {
    if (ip === "unknown" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return {}
    }
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReportBot/1.0)" },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data.error) return {}
    return { country: data.country_code || null, city: data.city || null, timezone: data.timezone || null }
  } catch {
    try {
      const fallback = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,timezone`)
      const fallbackData = await fallback.json()
      if (fallbackData.status === "success") {
        return { country: fallbackData.countryCode || null, city: fallbackData.city || null, timezone: fallbackData.timezone || null }
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

    const rateLimitResult = checkRateLimit(ip, 60 * 60 * 1000, 3)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many reports. Please try again later.", code: "RATE_LIMITED", resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    let body: ReportRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body", code: "INVALID_JSON" }, { status: 400 })
    }

    if (!body.phone || !body.reason) {
      return NextResponse.json({ error: "Phone number and reason are required", code: "MISSING_FIELDS" }, { status: 400 })
    }

    const cleanPhone = body.phone.replace(/\s/g, "")
    const phoneRegex = /^(\+213|0)[5-7]\d{8}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid Algerian phone number format", code: "INVALID_PHONE" }, { status: 400 })
    }

    const validReasons = [
      "Product dissatisfaction", "Refused to open package", "Package damaged during delivery",
      "Customer changed mind", "Other",
      "عدم الرضا عن المنتج", "رفض فتح الطرد", "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى",
      "Insatisfaction produit", "Refus d'ouvrir le colis", "Colis endommagé à la livraison",
      "Changement d'avis du client", "Autre",
    ]

    if (!validReasons.includes(body.reason)) {
      return NextResponse.json({ error: "Invalid reason provided", code: "INVALID_REASON" }, { status: 400 })
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()
    const reportsCollection = db.collection("reports")
    const statsCollection = db.collection("report_stats")

    // Check duplicate in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentReport = await reportsCollection.findOne({
      phoneNumber: cleanPhone,
      createdAt: { $gte: twentyFourHoursAgo },
    })

    if (recentReport) {
      return NextResponse.json(
        { error: "This phone number has already been reported recently", code: "DUPLICATE_REPORT", lastReported: recentReport.createdAt },
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

    await statsCollection.updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: 1 }, $set: { lastUpdated: now } },
      { upsert: true }
    )

    return NextResponse.json(
      { message: "Report submitted successfully", id: result.insertedId.toString(), timestamp: now },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error processing report:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}