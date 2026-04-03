import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized", code: "INVALID_PASSWORD" },
        { status: 401 }
      )
    }

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()
    const col = db.collection("reports")

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now)
    startOfMonth.setDate(now.getDate() - 30)

    // Run all queries in parallel
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
      // Total reports
      col.countDocuments(),

      // Today
      col.countDocuments({ createdAt: { $gte: startOfToday } }),

      // Last 7 days
      col.countDocuments({ createdAt: { $gte: startOfWeek } }),

      // Last 30 days
      col.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Reports by reason
      col
        .aggregate([
          { $group: { _id: "$reason", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      // Top 10 most reported phone numbers (masked)
      col
        .aggregate([
          { $group: { _id: "$phoneNumber", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Last 10 reports
      col
        .find({})
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

      // Daily reports for last 30 days
      col
        .aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      // Top countries
      col
        .aggregate([
          { $match: { reporterCountry: { $ne: null } } },
          { $group: { _id: "$reporterCountry", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ])

    // Mask phone numbers (keep first 4 and last 2 digits)
    const maskedTopNumbers = topNumbers.map((item) => ({
      phone:
        item._id.substring(0, 4) +
        "****" +
        item._id.substring(item._id.length - 2),
      count: item.count,
    }))

    const maskedRecent = recentReports.map((r) => ({
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
      reasons: reasonsAgg.map((r) => ({ name: r._id, count: r.count })),
      topNumbers: maskedTopNumbers,
      recentReports: maskedRecent,
      dailyChart: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
      countries: countriesAgg.map((c) => ({ country: c._id, count: c.count })),
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}