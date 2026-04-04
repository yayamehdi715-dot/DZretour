import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    const [uniquePhones, appStats] = await Promise.all([
      // Count of distinct reported phone numbers
      db.collection("reports").distinct("phoneNumber"),
      // Global app stats (visits + checks)
      db.collection("app_stats").findOne({ _id: "global" as any }),
    ])

    return NextResponse.json({
      uniqueReportedPhones: uniquePhones.length,
      totalChecks: appStats?.totalChecks ?? 0,
      totalVisits: appStats?.totalVisits ?? 0,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json(
      { uniqueReportedPhones: 0, totalChecks: 0, totalVisits: 0 },
      { status: 200 }
    )
  }
}