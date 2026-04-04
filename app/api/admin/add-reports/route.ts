// 📁 EMPLACEMENT : app/api/admin/add-reports/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

function normalizePhone(phone: string): string {
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, "")
  if (cleaned.startsWith("+213"))                              cleaned = "0" + cleaned.substring(4)
  else if (cleaned.startsWith("00213"))                       cleaned = "0" + cleaned.substring(5)
  else if (cleaned.startsWith("213") && cleaned.length === 12) cleaned = "0" + cleaned.substring(3)
  else if (/^[567]\d{8}$/.test(cleaned))                      cleaned = "0" + cleaned
  return cleaned
}

function isValidPhone(phone: string): boolean {
  return /^0[567]\d{8}$/.test(phone)
}

function sanitize(str: string, max: number): string {
  return str.slice(0, max).replace(/[\x00-\x1F\x7F]/g, "")
}

const VALID_REASONS = [
  // Nouvelles raisons publiques
  "Insatisfaction client", "Changement d'avis client", "Sans raison valable", "Autre",
  // Anciennes raisons FR
  "Insatisfaction produit", "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison", "Changement d'avis du client",
  // AR
  "عدم الرضا عن المنتج", "رفض فتح الطرد",
  "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى",
  // EN
  "Product dissatisfaction", "Refused to open package",
  "Package damaged during delivery", "Customer changed mind", "Other",
  // Admin
  "Non spécifiée",
]

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Serveur mal configuré", code: "MISSING_ENV" }, { status: 500 })
  }

  let body: { username?: unknown; password?: unknown; phones?: unknown; reason?: unknown; customReason?: unknown }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

  if (!verifyAdmin(
    typeof body.username === "string" ? body.username : undefined,
    typeof body.password === "string" ? body.password : undefined,
  )) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  if (typeof body.phones !== "string") {
    return NextResponse.json({ error: "Numéros requis", code: "MISSING_FIELDS" }, { status: 400 })
  }

  // La raison est optionnelle pour l'admin
  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim()
    : "Non spécifiée"

  if (reason !== "Non spécifiée" && !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Raison invalide", code: "INVALID_REASON" }, { status: 400 })
  }

  const customReason = typeof body.customReason === "string"
    ? sanitize(body.customReason, 200).trim() || null
    : null

  const rawPhones = body.phones.split(",").map(function(p: string) { return p.trim() }).filter(Boolean)
  if (rawPhones.length === 0) return NextResponse.json({ error: "Aucun numéro", code: "EMPTY_PHONES" }, { status: 400 })
  if (rawPhones.length > 100) return NextResponse.json({ error: "Maximum 100 numéros", code: "TOO_MANY" }, { status: 400 })

  let db: any
  try {
    const { getDb } = await import("@/lib/mongodb")
    db = await getDb()
  } catch {
    return NextResponse.json({ error: "Connexion DB échouée", code: "DB_ERROR" }, { status: 500 })
  }

  const col = db.collection("reports")
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const normalized = rawPhones.map(function(raw: string) {
    const phone = normalizePhone(raw)
    return { raw, phone, valid: isValidPhone(phone) }
  })

  const validPhones: string[] = normalized.filter(function(n: any) { return n.valid }).map(function(n: any) { return n.phone })
  const invalidResults = normalized
    .filter(function(n: any) { return !n.valid })
    .map(function(n: any) { return { phone: n.raw, status: "invalid" } })

  if (validPhones.length === 0) {
    return NextResponse.json({
      summary: { total: rawPhones.length, added: 0, invalid: invalidResults.length, duplicate: 0 },
      results: invalidResults,
    })
  }

  const recentlyReported: string[] = await col.distinct("phoneNumber", {
    phoneNumber: { $in: validPhones },
    reporterUserAgent: "admin-manual",
    createdAt: { $gte: threeDaysAgo },
  })
  const recentSet = new Set(recentlyReported)

  const toInsert = validPhones.filter(function(p: string) { return !recentSet.has(p) })
  const duplicateResults = validPhones
    .filter(function(p: string) { return recentSet.has(p) })
    .map(function(p: string) { return { phone: p, status: "duplicate" } })

  let addedCount = 0
  const addedResults: Array<{ phone: string; status: string }> = []

  if (toInsert.length > 0) {
    const docs = toInsert.map(function(phone: string) {
      return {
        phoneNumber: phone, reason, customReason,
        reporterIp: null, reporterUserAgent: "admin-manual",
        reporterCountry: null, reporterCity: null, reporterTimezone: null,
        createdAt: now, updatedAt: now,
      }
    })
    try {
      await col.insertMany(docs, { ordered: false })
      addedCount = toInsert.length
      toInsert.forEach(function(p: string) { addedResults.push({ phone: p, status: "added" }) })
    } catch (err: any) {
      addedCount = err?.result?.insertedCount ?? 0
    }
  }

  if (addedCount > 0) {
    db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: addedCount }, $set: { lastUpdated: now } },
      { upsert: true }
    ).catch(function() {})
  }

  return NextResponse.json({
    summary: { total: rawPhones.length, added: addedResults.length, invalid: invalidResults.length, duplicate: duplicateResults.length },
    results: invalidResults.concat(duplicateResults).concat(addedResults),
  })
}