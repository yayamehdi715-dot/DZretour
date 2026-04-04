// 📁 EMPLACEMENT : app/api/admin/add-reports/route.ts  (remplace l'existant)
import { type NextRequest, NextResponse } from "next/server"
import { normalizePhone, isValidPhone, sanitizeString } from "@/lib/phone"
import { verifyAdminCredentials, checkEnvVars } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const VALID_REASONS = new Set([
  "Product dissatisfaction", "Refused to open package",
  "Package damaged during delivery", "Customer changed mind", "Other",
  "عدم الرضا عن المنتج", "رفض فتح الطرد",
  "تلف الطرد أثناء التوصيل", "تغيير رأي العميل", "أخرى",
  "Insatisfaction produit", "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison", "Changement d'avis du client", "Autre",
])

export async function POST(request: NextRequest) {
  // 1. Env check
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: "Serveur mal configuré", code: "MISSING_ENV" }, { status: 500 })
  }

  // 2. Parse
  let body: { username?: unknown; password?: unknown; phones?: unknown; reason?: unknown; customReason?: unknown }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "JSON invalide", code: "INVALID_JSON" }, { status: 400 }) }

  // 3. Auth timing-safe
  if (!verifyAdminCredentials(
    typeof body.username === "string" ? body.username : undefined,
    typeof body.password === "string" ? body.password : undefined,
  )) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  // 4. Validation des champs
  if (typeof body.phones !== "string" || typeof body.reason !== "string") {
    return NextResponse.json({ error: "Numéros et raison requis", code: "MISSING_FIELDS" }, { status: 400 })
  }

  const reason = body.reason.trim()
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: "Raison invalide", code: "INVALID_REASON" }, { status: 400 })
  }

  const customReason = typeof body.customReason === "string"
    ? sanitizeString(body.customReason, 200).trim() || null
    : null

  // 5. Parse et dédoublonnage des numéros dans la requête elle-même
  const rawPhones = body.phones
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)

  if (rawPhones.length === 0) {
    return NextResponse.json({ error: "Aucun numéro fourni", code: "EMPTY_PHONES" }, { status: 400 })
  }
  if (rawPhones.length > 100) {
    return NextResponse.json({ error: "Maximum 100 numéros à la fois", code: "TOO_MANY" }, { status: 400 })
  }

  // 6. Connexion DB
  let db: any
  try {
    const { getDb } = await import("@/lib/mongodb")
    db = await getDb()
  } catch (err: any) {
    return NextResponse.json({ error: "Connexion DB échouée", code: "DB_ERROR" }, { status: 500 })
  }

  const col = db.collection("reports")
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 7. Normalisation + validation
  const normalized: { raw: string; phone: string; valid: boolean }[] = rawPhones.map(raw => {
    const phone = normalizePhone(raw)
    return { raw, phone, valid: isValidPhone(phone) }
  })

  const validPhones = normalized.filter(n => n.valid).map(n => n.phone)
  const invalidResults = normalized
    .filter(n => !n.valid)
    .map(n => ({ phone: n.raw, status: "invalid" as const }))

  if (validPhones.length === 0) {
    return NextResponse.json({
      summary: { total: rawPhones.length, added: 0, invalid: invalidResults.length, duplicate: 0 },
      results: invalidResults,
    })
  }

  // 8. Vérification des doublons en une seule requête (optimisation)
  const recentlyReported = await col.distinct("phoneNumber", {
    phoneNumber: { $in: validPhones },
    createdAt: { $gte: twentyFourHoursAgo },
  })
  const recentSet = new Set(recentlyReported as string[])

  const toInsert = validPhones.filter(p => !recentSet.has(p))
  const duplicateResults = validPhones
    .filter(p => recentSet.has(p))
    .map(p => ({ phone: p, status: "duplicate" as const }))

  // 9. Insertion en batch (une seule requête pour tous les numéros valides)
  let addedCount = 0
  const addedResults: { phone: string; status: "added" }[] = []

  if (toInsert.length > 0) {
    const docs = toInsert.map(phone => ({
      phoneNumber: phone,
      reason,
      customReason,
      reporterIp: null,
      reporterUserAgent: "admin-manual",
      reporterCountry: null,
      reporterCity: null,
      reporterTimezone: null,
      createdAt: now,
      updatedAt: now,
    }))

    try {
      await col.insertMany(docs, { ordered: false })
      addedCount = toInsert.length
      addedResults.push(...toInsert.map(p => ({ phone: p, status: "added" as const })))
    } catch (err: any) {
      // Gestion des erreurs partielles (ex: duplicate key en cas de race condition)
      const inserted = err?.result?.insertedCount ?? 0
      addedCount = inserted
      console.error("[admin/add-reports] insertMany partial error:", err?.message)
    }
  }

  // 10. Mise à jour des stats (non-bloquante)
  if (addedCount > 0) {
    db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: addedCount }, $set: { lastUpdated: now } },
      { upsert: true }
    ).catch((err: any) => console.error("[admin/add-reports] Stats update:", err?.message))
  }

  const allResults = [...invalidResults, ...duplicateResults, ...addedResults]

  return NextResponse.json({
    summary: {
      total:     rawPhones.length,
      added:     addedResults.length,
      invalid:   invalidResults.length,
      duplicate: duplicateResults.length,
    },
    results: allResults,
  })
}