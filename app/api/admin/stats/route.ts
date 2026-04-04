// 📁 EMPLACEMENT : app/api/admin/stats/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Comparaison en temps constant — pas d'import crypto externe
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function verifyAdmin(username?: string, password?: string): boolean {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return false
  if (!username || !password) return false
  return safeCompare(username, process.env.ADMIN_USER) &&
         safeCompare(password, process.env.ADMIN_PASSWORD)
}

const REASON_MAP: Record<string, string> = {
  "Product dissatisfaction":        "Insatisfaction produit",
  "Refused to open package":        "Refus d'ouvrir le colis",
  "Package damaged during delivery":"Colis endommagé",
  "Customer changed mind":          "Changement d'avis",
  "Other":                          "Autre",
  "عدم الرضا عن المنتج":           "Insatisfaction produit",
  "رفض فتح الطرد":                 "Refus d'ouvrir le colis",
  "تلف الطرد أثناء التوصيل":       "Colis endommagé",
  "تغيير رأي العميل":              "Changement d'avis",
  "أخرى":                          "Autre",
  "Insatisfaction produit":         "Insatisfaction produit",
  "Refus d'ouvrir le colis":        "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison": "Colis endommagé",
  "Changement d'avis du client":    "Changement d'avis",
  "Autre":                          "Autre",
}

function maskPhone(p: string): string {
  if (!p || p.length < 6) return "****"
  return p.substring(0, 4) + "****" + p.substring(p.length - 2)
}

export async function POST(request: NextRequest) {
  // 1. Vérification des variables d'environnement
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Serveur mal configuré : variables ADMIN manquantes", code: "MISSING_ENV" }, { status: 500 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Serveur mal configuré : MONGODB_URI manquant", code: "MISSING_ENV" }, { status: 500 })
  }

  // 2. Parse du body
  let body: { username?: unknown; password?: unknown }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

  // 3. Auth
  if (!verifyAdmin(
    typeof body.username === "string" ? body.username : undefined,
    typeof body.password === "string" ? body.password : undefined,
  )) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  // 4. Connexion MongoDB
  let db: any
  try {
    const { getDb } = await import("@/lib/mongodb")
    db = await getDb()
  } catch (err: any) {
    console.error("[admin/stats] DB:", err?.message)
    return NextResponse.json({ error: "Connexion base de données échouée", code: "DB_ERROR" }, { status: 500 })
  }

  // 5. Requêtes en parallèle
  try {
    const col = db.collection("reports")
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalReports, todayReports, weekReports, monthReports,
      uniquePhones, reasonsAgg, topNumbers, recentReports,
      dailyAgg, countriesAgg, appStats,
    ] = await Promise.all([
      col.countDocuments(),
      col.countDocuments({ createdAt: { $gte: startOfToday } }),
      col.countDocuments({ createdAt: { $gte: startOfWeek  } }),
      col.countDocuments({ createdAt: { $gte: startOfMonth } }),
      col.distinct("phoneNumber"),
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
        .project({ phoneNumber: 1, reason: 1, customReason: 1, reporterCountry: 1, reporterCity: 1, createdAt: 1, _id: 0 })
        .toArray(),
      col.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      col.aggregate([
        { $match: { reporterCountry: { $ne: null } } },
        { $group: { _id: "$reporterCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),
      db.collection("app_stats").findOne(
        { _id: "global" },
        { projection: { totalChecks: 1, totalVisits: 1, _id: 0 } }
      ),
    ])

    // Fusion des raisons multi-langues
    const mergedReasons: Record<string, number> = {}
    for (let i = 0; i < reasonsAgg.length; i++) {
      const r = reasonsAgg[i]
      const label = REASON_MAP[r._id as string] ?? (r._id as string)
      mergedReasons[label] = (mergedReasons[label] ?? 0) + r.count
    }

    return NextResponse.json({
      overview: {
        totalReports,
        uniquePhones: uniquePhones.length,
        today:       todayReports,
        week:        weekReports,
        month:       monthReports,
        totalChecks: appStats?.totalChecks  ?? 0,
        totalVisits: appStats?.totalVisits  ?? 0,
      },
      reasons: Object.entries(mergedReasons)
        .map(function(e) { return { name: e[0], count: e[1] } })
        .sort(function(a, b) { return b.count - a.count }),
      topNumbers: topNumbers.map(function(i: any) { return { phone: maskPhone(i._id), count: i.count } }),
      recentReports: recentReports.map(function(r: any) {
        return {
          phone:        maskPhone(r.phoneNumber),
          reason:       REASON_MAP[r.reason] ?? r.reason,
          customReason: r.customReason ?? null,
          country:      r.reporterCountry ?? null,
          city:         r.reporterCity    ?? null,
          createdAt:    r.createdAt,
        }
      }),
      dailyChart: dailyAgg.map(function(d: any) { return { date: d._id, count: d.count } }),
      countries:  countriesAgg.map(function(c: any) { return { country: c._id, count: c.count } }),
    })
  } catch (err: any) {
    console.error("[admin/stats] Query:", err?.message)
    return NextResponse.json({ error: "Erreur lors des requêtes", code: "QUERY_ERROR" }, { status: 500 })
  }
}