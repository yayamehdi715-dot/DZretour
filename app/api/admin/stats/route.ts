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

    const response = NextResponse.json({
      uniqueReportedPhones: uniquePhones.length,
      totalChecks:  appStats?.totalChecks  ?? 0,
      totalVisits:  appStats?.totalVisits  ?? 0,
    })

    // Cache 5 minutes côté CDN pour éviter de surcharger la DB sur la home
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    return response
  } catch (error) {
    console.error("[stats] Error:", error)
    // Retourne des zéros plutôt qu'une erreur pour ne pas casser la home
    return NextResponse.json(
      { uniqueReportedPhones: 0, totalChecks: 0, totalVisits: 0 },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}