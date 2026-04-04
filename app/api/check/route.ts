import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  try {
    const { getDb } = await import("@/lib/mongodb")
    const db = await getDb()

    await db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalVisits: 1 }, $set: { lastUpdated: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}