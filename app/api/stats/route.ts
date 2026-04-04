// 📁 EMPLACEMENT : app/api/stats/route.ts  (remplace l'existant)
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    const [uniquePhones, appStats] = await Promise.all([
      db.collection("reports").distinct("phoneNumber"),
      db.collection("app_stats").findOne(
        { _id: "global" as any },
        { projection: { totalChecks: 1, totalVisits: 1, _id: 0 } }
      ),
    ])

    return NextResponse.json(
      {
        uniqueReportedPhones: uniquePhones.length,
        totalChecks:  appStats?.totalChecks  ?? 0,
        totalVisits:  appStats?.totalVisits  ?? 0,
      },
      {
        headers: {
          // Pas de cache CDN — données temps réel
          // stale-while-revalidate=10 : le navigateur peut servir une copie stale
          // pendant 10s le temps de refetch en arrière-plan
          "Cache-Control": "public, s-maxage=0, stale-while-revalidate=10",
        },
      }
    )
  } catch (error) {
    console.error("[stats] Error:", error)
    return NextResponse.json(
      { uniqueReportedPhones: 0, totalChecks: 0, totalVisits: 0 },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}