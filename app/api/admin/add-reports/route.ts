import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminCredentials } from "@/lib/auth"
import {
  normalizePhone, isValidPhone, sanitizeString,
  hashPhone, encryptPhone, maskPhone,
} from "@/lib/phone"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

  if (!verifyAdminCredentials(
    typeof body.username === "string" ? body.username : undefined,
    typeof body.password === "string" ? body.password : undefined,
  )) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  if (typeof body.phones !== "string") {
    return NextResponse.json({ error: "Numéros requis", code: "MISSING_FIELDS" }, { status: 400 })
  }

  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim()
    : "Non spécifiée"

  if (reason !== "Non spécifiée" && !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Raison invalide", code: "INVALID_REASON" }, { status: 400 })
  }

  const customReason = typeof body.customReason === "string"
    ? sanitizeString(body.customReason, 200).trim() || null
    : null

  const rawPhones = body.phones.split(",").map((p: string) => p.trim()).filter(Boolean)
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

  const normalized = rawPhones.map((raw: string) => {
    const phone = normalizePhone(raw)
    return { raw, phone, valid: isValidPhone(phone) }
  })

  const validEntries: Array<{ raw: string; phone: string }> = normalized.filter((n: any) => n.valid)
  const validPhones = validEntries.map((n: any) => n.phone)
  const invalidResults = normalized
    .filter((n: any) => !n.valid)
    .map((n: any) => ({ phone: n.raw, status: "invalid" }))

  if (validPhones.length === 0) {
    return NextResponse.json({
      summary: { total: rawPhones.length, added: 0, invalid: invalidResults.length, duplicate: 0 },
      results: invalidResults,
    })
  }

  // Anti-doublon : vérifie à la fois les anciens (phoneNumber) et nouveaux (phoneHash) docs
  const validHashes = validPhones.map(hashPhone).filter(Boolean) as string[]
  const [recentByPhone, recentByHash] = await Promise.all([
    col.distinct("phoneNumber", {
      phoneNumber: { $in: validPhones },
      reporterUserAgent: "admin-manual",
      createdAt: { $gte: threeDaysAgo },
    }),
    validHashes.length > 0
      ? col.distinct("phoneHash", {
          phoneHash: { $in: validHashes },
          reporterUserAgent: "admin-manual",
          createdAt: { $gte: threeDaysAgo },
        })
      : Promise.resolve([]),
  ])

  // Reconstruit l'ensemble des doublons (par phone clair ou par hash)
  const recentPhoneSet = new Set(recentByPhone as string[])
  const recentHashSet  = new Set(recentByHash as string[])

  const toInsert = validPhones.filter(p => {
    const h = hashPhone(p)
    return !recentPhoneSet.has(p) && !(h && recentHashSet.has(h))
  })
  const duplicateResults = validPhones
    .filter(p => {
      const h = hashPhone(p)
      return recentPhoneSet.has(p) || (h && recentHashSet.has(h))
    })
    .map(p => ({ phone: maskPhone(p), status: "duplicate" }))

  let addedCount = 0
  const addedResults: Array<{ phone: string; status: string }> = []

  if (toInsert.length > 0) {
    const docs = toInsert.map((phone: string) => {
      const phoneHashVal      = hashPhone(phone)
      const phoneEncryptedVal = encryptPhone(phone)
      const phoneMaskedVal    = maskPhone(phone)

      const doc: Record<string, unknown> = {
        reason, customReason,
        phoneMasked: phoneMaskedVal,
        reporterIp: null,
        reporterUserAgent: "admin-manual",
        reporterCountry: null, reporterCity: null, reporterTimezone: null,
        createdAt: now, updatedAt: now,
      }

      if (phoneHashVal && phoneEncryptedVal) {
        doc.phoneHash      = phoneHashVal
        doc.phoneEncrypted = phoneEncryptedVal
      } else {
        doc.phoneNumber = phone
      }

      return doc
    })

    try {
      await col.insertMany(docs, { ordered: false })
      addedCount = toInsert.length
      toInsert.forEach((p: string) => addedResults.push({ phone: maskPhone(p), status: "added" }))
    } catch (err: any) {
      addedCount = err?.result?.insertedCount ?? 0
    }
  }

  if (addedCount > 0) {
    db.collection("app_stats").updateOne(
      { _id: "global" as any },
      { $inc: { totalReports: addedCount }, $set: { lastUpdated: now } },
      { upsert: true }
    ).catch(() => {})
  }

  return NextResponse.json({
    summary: { total: rawPhones.length, added: addedResults.length, invalid: invalidResults.length, duplicate: duplicateResults.length },
    results: invalidResults.concat(duplicateResults).concat(addedResults),
  })
}
