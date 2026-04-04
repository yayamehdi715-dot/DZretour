import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  // Check env vars
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Server misconfigured: ADMIN_USER or ADMIN_PASSWORD not set", code: "MISSING_ENV" }, { status: 500 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Server misconfigured: MONGODB_URI not set", code: "MISSING_ENV" }, { status: 500 })
  }

  let body: { username?: string; password?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 }) }

  if (body.username !== process.env.ADMIN_USER || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  let db: any
  try {
    const { getDb } = await import("@/lib/mongodb")
    db = await getDb()
  } catch (err: any) {
    return NextResponse.json({ error: "Connexion base de données échouée: " + (err?.message || ""), code: "DB_ERROR" }, { status: 500 })
  }

  try {
    const col = db.collection("reports")
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30)

    const [
      totalReports, todayReports, weekReports, monthReports,
      uniquePhones, reasonsAgg, topNumbers, recentReports,
      dailyAgg, countriesAgg, appStats,
    ] = await Promise.all([
      col.countDocuments(),
      col.countDocuments({ createdAt: { $gte: startOfToday } }),
      col.countDocuments({ createdAt: { $gte: startOfWeek } }),
      col.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Unique reported phone numbers
      col.distinct("phoneNumber"),

      // Reports grouped by reason (merged FR/AR/EN → display label)
      col.aggregate([
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      // Top 10 most reported numbers
      col.aggregate([
        { $group: { _id: "$phoneNumber", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]).toArray(),

      // Last 10 reports
      col.find({}).sort({ createdAt: -1 }).limit(10)
        .project({ phoneNumber: 1, reason: 1, customReason: 1, reporterCountry: 1, reporterCity: 1, createdAt: 1 })
        .toArray(),

      // Daily for chart
      col.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),

      // Top countries
      col.aggregate([
        { $match: { reporterCountry: { $ne: null } } },
        { $group: { _id: "$reporterCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]).toArray(),

      // App stats (visits + checks)
      db.collection("app_stats").findOne({ _id: "global" }),
    ])

    // Merge reason labels (AR/FR/EN → French label)
    const REASON_MAP: Record<string, string> = {
      "Product dissatisfaction": "Insatisfaction produit",
      "Refused to open package": "Refus d'ouvrir le colis",
      "Package damaged during delivery": "Colis endommagé",
      "Customer changed mind": "Changement d'avis",
      "Other": "Autre",
      "عدم الرضا عن المنتج": "Insatisfaction produit",
      "رفض فتح الطرد": "Refus d'ouvrir le colis",
      "تلف الطرد أثناء التوصيل": "Colis endommagé",
      "تغيير رأي العميل": "Changement d'avis",
      "أخرى": "Autre",
      "Insatisfaction produit": "Insatisfaction produit",
      "Refus d'ouvrir le colis": "Refus d'ouvrir le colis",
      "Colis endommagé à la livraison": "Colis endommagé",
      "Changement d'avis du client": "Changement d'avis",
      "Autre": "Autre",
    }
    const mergedReasons: Record<string, number> = {}
    for (const r of reasonsAgg) {
      const label = REASON_MAP[r._id] || r._id
      mergedReasons[label] = (mergedReasons[label] || 0) + r.count
    }

    const maskPhone = (p: string) => p.substring(0, 4) + "****" + p.substring(p.length - 2)

    return NextResponse.json({
      overview: {
        totalReports,
        uniquePhones: uniquePhones.length,
        today: todayReports,
        week: weekReports,
        month: monthReports,
        totalChecks: appStats?.totalChecks ?? 0,
        totalVisits: appStats?.totalVisits ?? 0,
      },
      reasons: Object.entries(mergedReasons)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      topNumbers: topNumbers.map((i: any) => ({ phone: maskPhone(i._id), count: i.count })),
      recentReports: recentReports.map((r: any) => ({
        phone: maskPhone(r.phoneNumber),
        reason: REASON_MAP[r.reason] || r.reason,
        customReason: r.customReason,
        country: r.reporterCountry,
        city: r.reporterCity,
        createdAt: r.createdAt,
      })),
      dailyChart: dailyAgg.map((d: any) => ({ date: d._id, count: d.count })),
      countries: countriesAgg.map((c: any) => ({ country: c._id, count: c.count })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Erreur requête: " + (err?.message || ""), code: "QUERY_ERROR" }, { status: 500 })
  }
}