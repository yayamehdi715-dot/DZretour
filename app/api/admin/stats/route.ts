import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  // 1. Check env vars first
  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in environment variables")
    return NextResponse.json(
      { error: "Server misconfigured: ADMIN_PASSWORD not set", code: "MISSING_ENV" },
      { status: 500 }
    )
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set in environment variables")
    return NextResponse.json(
      { error: "Server misconfigured: MONGODB_URI not set", code: "MISSING_ENV" },
      { status: 500 }
    )
  }

  // 2. Parse body
  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_JSON" },
      { status: 400 }
    )
  }

  // 3. Check password
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Unauthorized", code: "INVALID_PASSWORD" },
      { status: 401 }
    )
  }

  // 4. Connect to MongoDB
  let db: any
  try {
    const { getDb } = await import("@/lib/mongodb")
    db = await getDb()
  } catch (err: any) {
    console.error("MongoDB connection failed:", err?.message || err)
    return NextResponse.json(
      { error: "Database connection failed: " + (err?.message || "unknown"), code: "DB_ERROR" },
      { status: 500 }
    )
  }

  // 5. Run queries
  try {
    const col = db.collection("reports")

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now)
    startOfMonth.setDate(now.getDate() - 30)

    const [
      totalReports,
      todayReports,
      weekReports,
      monthReports,
      reasonsAgg,
      topNumbers,
      recentReports,
      dailyAgg,
      countriesAgg,
    ] = await Promise.all([
      col.countDocuments(),
      col.countDocuments({ createdAt: { $gte: startOfToday } }),
      col.countDocuments({ createdAt: { $gte: startOfWeek } }),
      col.countDocuments({ createdAt: { $gte: startOfMonth } }),

      col.aggregate([
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      col.aggregate([
        { $group: { _id: "$phoneNumber", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),

      col.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .project({
          phoneNumber: 1,
          reason: 1,
          customReason: 1,
          reporterCountry: 1,
          reporterCity: 1,
          createdAt: 1,
        })
        .toArray(),

      col.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),

      col.aggregate([
        { $match: { reporterCountry: { $ne: null } } },
        { $group: { _id: "$reporterCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),
    ])

    const maskedTopNumbers = topNumbers.map((item: any) => ({
      phone:
        item._id.substring(0, 4) +
        "****" +
        item._id.substring(item._id.length - 2),
      count: item.count,
    }))

    const maskedRecent = recentReports.map((r: any) => ({
      phone:
        r.phoneNumber.substring(0, 4) +
        "****" +
        r.phoneNumber.substring(r.phoneNumber.length - 2),
      reason: r.reason,
      customReason: r.customReason,
      country: r.reporterCountry,
      city: r.reporterCity,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({
      overview: {
        total: totalReports,
        today: todayReports,
        week: weekReports,
        month: monthReports,
      },
      reasons: reasonsAgg.map((r: any) => ({ name: r._id, count: r.count })),
      topNumbers: maskedTopNumbers,
      recentReports: maskedRecent,
      dailyChart: dailyAgg.map((d: any) => ({ date: d._id, count: d.count })),
      countries: countriesAgg.map((c: any) => ({ country: c._id, count: c.count })),
    })
  } catch (err: any) {
    console.error("Query error:", err?.message || err)
    return NextResponse.json(
      { error: "Query failed: " + (err?.message || "unknown"), code: "QUERY_ERROR" },
      { status: 500 }
    )
  }
}