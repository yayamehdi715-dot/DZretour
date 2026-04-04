// 📁 EMPLACEMENT : app/api/admin/analytics/route.ts  (nouveau fichier)
// Nécessite 2 variables d'environnement dans Vercel :
//   GOOGLE_ANALYTICS_PROPERTY_ID = "properties/XXXXXXXXX"  (trouvé dans GA4 > Admin > Property details)
//   GOOGLE_SERVICE_ACCOUNT_JSON  = contenu JSON du fichier de compte de service (voir README ci-dessous)
//
// COMMENT CRÉER LE COMPTE DE SERVICE :
//   1. Va sur https://console.cloud.google.com
//   2. Crée un projet → Active l'API "Google Analytics Data API"
//   3. IAM & Admin → Comptes de service → Créer → Télécharge le JSON
//   4. Dans GA4 : Admin → Gestion des accès à la propriété → Ajoute l'email du compte de service (rôle : Lecteur)
//   5. Copie tout le contenu du fichier JSON dans la variable GOOGLE_SERVICE_ACCOUNT_JSON

import { type NextRequest, NextResponse } from "next/server"

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

function verifyAdmin(username?: string, password?: string): boolean {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return false
  if (!username || !password) return false
  return safeCompare(username, process.env.ADMIN_USER) &&
         safeCompare(password, process.env.ADMIN_PASSWORD)
}

// Crée un JWT signé RS256 pour le compte de service Google
async function createServiceAccountJWT(credentials: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  function base64url(obj: object): string {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  }

  const signingInput = `${base64url(header)}.${base64url(payload)}`

  // Import la clé privée RSA du compte de service
  const privateKey = credentials.private_key.replace(/\\n/g, "\n")
  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "")

  const { createSign } = await import("crypto")
  const sign = createSign("RSA-SHA256")
  sign.update(signingInput)
  const signature = sign.sign(privateKey, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  return `${signingInput}.${signature}`
}

// Échange le JWT contre un access token Google OAuth2
async function getAccessToken(credentials: any): Promise<string> {
  const jwt = await createServiceAccountJWT(credentials)
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OAuth2 token error: ${err}`)
  }
  const data = await res.json()
  return data.access_token
}

// Appelle l'API GA4 Data
async function runGAReport(propertyId: string, token: string, body: object): Promise<any> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error: ${err}`)
  }
  return res.json()
}

function parseRows(report: any): { dimension: string; value: number }[] {
  if (!report?.rows) return []
  return report.rows.map((row: any) => ({
    dimension: row.dimensionValues?.[0]?.value ?? "unknown",
    value: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
  }))
}

export async function POST(request: NextRequest) {
  // 1. Auth admin
  let body: { username?: unknown; password?: unknown }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }) }

  if (!verifyAdmin(
    typeof body.username === "string" ? body.username : undefined,
    typeof body.password === "string" ? body.password : undefined,
  )) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: "Identifiants incorrects", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  // 2. Vérification des variables GA
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON non configuré", code: "MISSING_GA_CREDENTIALS" }, { status: 503 })
  }
  if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
    return NextResponse.json({ error: "GOOGLE_ANALYTICS_PROPERTY_ID non configuré", code: "MISSING_GA_PROPERTY" }, { status: 503 })
  }

  // 3. Récupération du token
  let token: string
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    token = await getAccessToken(credentials)
  } catch (err: any) {
    return NextResponse.json({ error: "Erreur authentification GA: " + err.message, code: "GA_AUTH_ERROR" }, { status: 503 })
  }

  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID
  const dateRange = [{ startDate: "30daysAgo", endDate: "today" }]

  // 4. Toutes les requêtes GA4 en parallèle
  try {
    const [
      overviewReport,
      dailyReport,
      pagesReport,
      countriesReport,
      devicesReport,
      realtimeReport,
    ] = await Promise.all([
      // Vue d'ensemble 30 jours
      runGAReport(propertyId, token, {
        dateRanges: dateRange,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "newUsers" },
        ],
      }),
      // Utilisateurs par jour
      runGAReport(propertyId, token, {
        dateRanges: dateRange,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Pages les plus visitées
      runGAReport(propertyId, token, {
        dateRanges: dateRange,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 5,
      }),
      // Pays
      runGAReport(propertyId, token, {
        dateRanges: dateRange,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      // Appareils
      runGAReport(propertyId, token, {
        dateRanges: dateRange,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // Temps réel (utilisateurs actifs maintenant)
      fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runRealtimeReport`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ metrics: [{ name: "activeUsers" }] }),
        }
      ).then(r => r.json()),
    ])

    // Parse overview
    const metrics = overviewReport.rows?.[0]?.metricValues ?? []
    const overview = {
      activeUsers:             parseInt(metrics[0]?.value ?? "0", 10),
      sessions:                parseInt(metrics[1]?.value ?? "0", 10),
      pageViews:               parseInt(metrics[2]?.value ?? "0", 10),
      bounceRate:              parseFloat((parseFloat(metrics[3]?.value ?? "0") * 100).toFixed(1)),
      avgSessionDuration:      parseInt(metrics[4]?.value ?? "0", 10),
      newUsers:                parseInt(metrics[5]?.value ?? "0", 10),
      activeUsersRealtime:     parseInt(realtimeReport?.rows?.[0]?.metricValues?.[0]?.value ?? "0", 10),
    }

    // Parse daily
    const daily = (dailyReport.rows ?? []).map((row: any) => {
      const d = row.dimensionValues?.[0]?.value ?? ""
      return {
        date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
        users: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
        sessions: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
      }
    })

    // Parse pages
    const pages = (pagesReport.rows ?? []).map((row: any) => ({
      path: row.dimensionValues?.[0]?.value ?? "/",
      views: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    }))

    // Parse countries
    const countries = parseRows(countriesReport)

    // Parse devices
    const devices = parseRows(devicesReport)

    return NextResponse.json({
      overview,
      daily,
      pages,
      countries,
      devices,
    })
  } catch (err: any) {
    console.error("[admin/analytics] Error:", err.message)
    return NextResponse.json({ error: "Erreur requête GA4: " + err.message, code: "GA_QUERY_ERROR" }, { status: 503 })
  }
}