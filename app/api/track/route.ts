// 📁 EMPLACEMENT : app/api/track/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Déduplique les visites par session (simple Set en mémoire)
// En prod haute charge, utiliser Redis avec TTL
const recentVisitors = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = (forwardedFor?.split(",")[0] ?? realIp ?? "unknown").trim()

    // Déduplique par IP — on ne compte pas la même IP plus d'une fois par 30 min
    if (recentVisitors.has(ip)) {
      return NextResponse.json({ ok: true, counted: false })
    }

    recentVisitors.add(ip)
    // Supprime l'IP après 30 minutes
    setTimeout(() => recentVisitors.delete(ip), 30 * 60 * 1000)

    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    await db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalVisits: 1 }, $set: { lastUpdated: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ ok: true, counted: true })
  } catch (error) {
    console.error("[track] Error:", error)
    return NextResponse.json({ ok: false })
  }
}