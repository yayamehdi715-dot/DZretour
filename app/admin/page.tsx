// 📁 EMPLACEMENT : app/admin/page.tsx  (remplace l'existant)
"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts"
import {
  Shield, TrendingUp, AlertTriangle, Clock, Phone,
  MapPin, FileText, LogOut, RefreshCw, Eye, EyeOff,
  Activity, Users, Search, Plus, CheckCircle, XCircle,
  BarChart2, Globe, Monitor, Smartphone, Tablet,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminStats {
  overview: { totalReports: number; uniquePhones: number; today: number; week: number; month: number; totalChecks: number; totalVisits: number }
  reasons: { name: string; count: number }[]
  topNumbers: { phone: string; count: number }[]
  recentReports: { phone: string; reason: string; customReason?: string; country?: string; city?: string; createdAt: string }[]
  dailyChart: { date: string; count: number }[]
  countries: { country: string; count: number }[]
}
interface GAStats {
  overview: { activeUsers: number; sessions: number; pageViews: number; bounceRate: number; avgSessionDuration: number; newUsers: number; activeUsersRealtime: number }
  daily: { date: string; users: number; sessions: number }[]
  pages: { path: string; views: number }[]
  countries: { dimension: string; value: number }[]
  devices: { dimension: string; value: number }[]
}
interface AddResult {
  summary: { total: number; added: number; invalid: number; duplicate: number }
  results: { phone: string; status: "added" | "invalid" | "duplicate" }[]
}

const COLORS = ["#dc2626", "#f59e0b", "#6366f1", "#10b981", "#8b5cf6", "#f43f5e"]
const REASONS_FR = [
  "Insatisfaction client", "Changement d'avis client",
  "Sans raison valable", "Autre",
  "Insatisfaction produit", "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison", "Changement d'avis du client",
]

function fmt(s: string) { return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) }
function fmtDT(s: string) { return new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }
function fmtDuration(s: number) { const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s` }

// ── Session ───────────────────────────────────────────────────────────────────
const SESSION_KEY = "dzr_admin_session"
const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000
interface Session { username: string; password: string; expiry: number }
function saveSession(u: string, p: string) { localStorage.setItem(SESSION_KEY, JSON.stringify({ username: u, password: p, expiry: Date.now() + SESSION_DURATION })) }
function loadSession(): Session | null {
  try {
    const s: Session = JSON.parse(localStorage.getItem(SESSION_KEY) || "")
    if (Date.now() > s.expiry) { localStorage.removeItem(SESSION_KEY); return null }
    return s
  } catch { return null }
}
function clearSession() { localStorage.removeItem(SESSION_KEY) }

// ── Shared components ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3"><div className={`p-2.5 rounded-xl ${color} inline-flex`} aria-hidden="true"><Icon className="h-5 w-5 text-white" /></div></div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── GA Section ────────────────────────────────────────────────────────────────
function GASection({ username, password }: { username: string; password: string }) {
  const [gaStats, setGaStats] = useState<GAStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [notConfigured, setNotConfigured] = useState(false)

  async function fetchGA() {
    setIsLoading(true); setError("")
    try {
      const res = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "MISSING_GA_CREDENTIALS" || data.code === "MISSING_GA_PROPERTY") {
          setNotConfigured(true)
        } else {
          setError(data.error || "Erreur GA4")
        }
        return
      }
      setGaStats(data)
    } catch { setError("Impossible de contacter le serveur") }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchGA() }, [])

  const deviceIcon = (d: string) => {
    if (d === "mobile") return <Smartphone className="h-4 w-4" />
    if (d === "tablet") return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  if (notConfigured) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <BarChart2 className="h-10 w-10 text-amber-500 mx-auto mb-4" aria-hidden="true" />
        <h3 className="font-bold text-amber-800 mb-2">Google Analytics non configuré</h3>
        <p className="text-amber-700 text-sm mb-4">Pour connecter GA4, ajoutez ces 2 variables dans Vercel :</p>
        <div className="bg-white border border-amber-200 rounded-xl p-4 text-left text-xs font-mono space-y-2 max-w-lg mx-auto">
          <p><span className="text-amber-600">GOOGLE_ANALYTICS_PROPERTY_ID</span> = properties/XXXXXXXXX</p>
          <p><span className="text-amber-600">GOOGLE_SERVICE_ACCOUNT_JSON</span> = {"{"}"type":"service_account",...{"}"}</p>
        </div>
        <p className="text-amber-600 text-xs mt-3">
          Voir les instructions dans <code className="bg-amber-100 px-1 rounded">app/api/admin/analytics/route.ts</code>
        </p>
      </div>
    )
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" aria-hidden="true" />
      <p className="text-red-700 text-sm font-medium">{error}</p>
      <button type="button" onClick={fetchGA} className="mt-3 text-xs text-red-600 underline hover:no-underline">Réessayer</button>
    </div>
  )

  if (!gaStats) return null

  const { overview, daily, pages, countries, devices } = gaStats

  return (
    <div className="space-y-6">
      {/* Realtime badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
          {overview.activeUsersRealtime} utilisateur{overview.activeUsersRealtime !== 1 ? "s" : ""} actif{overview.activeUsersRealtime !== 1 ? "s" : ""} en ce moment
        </div>
        <button type="button" onClick={fetchGA} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Actualiser
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={Users}      label="Utilisateurs actifs (30j)" value={overview.activeUsers}   color="bg-blue-500" />
        <StatCard icon={Activity}   label="Sessions (30j)"            value={overview.sessions}      color="bg-violet-500" />
        <StatCard icon={Search}     label="Pages vues (30j)"          value={overview.pageViews}     color="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="Nouveaux utilisateurs"     value={overview.newUsers}      color="bg-emerald-500" />
        <StatCard icon={Clock}      label="Durée moy. session"        value={fmtDuration(overview.avgSessionDuration)} color="bg-amber-500" />
        <StatCard icon={Globe}      label="Taux de rebond"            value={`${overview.bounceRate}%`} color="bg-rose-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily users chart */}
        <section aria-label="Utilisateurs par jour" className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-5">Utilisateurs — 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11, fill: "#9ca3af" }} interval={4} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip labelFormatter={fmt} formatter={(v: any, n: string) => [v, n === "users" ? "Utilisateurs" : "Sessions"]}
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} />
              <Area type="monotone" dataKey="users" name="users" stroke="#6366f1" strokeWidth={2} fill="url(#gu)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="sessions" name="sessions" stroke="#dc2626" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block" /> Utilisateurs</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-primary inline-block border-dashed border" /> Sessions</span>
          </div>
        </section>

        {/* Devices */}
        <section aria-label="Appareils utilisés" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Appareils</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={devices} dataKey="value" nameKey="dimension" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [v, "sessions"]}
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-2 mt-2">
            {devices.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span style={{ color: COLORS[i % COLORS.length] }} aria-hidden="true">{deviceIcon(d.dimension)}</span>
                  {d.dimension === "mobile" ? "Mobile" : d.dimension === "tablet" ? "Tablette" : "Ordinateur"}
                </span>
                <span className="font-semibold text-gray-800 tabular-nums">{d.value.toLocaleString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <section aria-label="Pages les plus visitées" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Pages les plus visitées
          </h3>
          <ul className="space-y-2">
            {pages.map((p, i) => {
              const max = pages[0]?.views || 1
              const pct = Math.round((p.views / max) * 100)
              return (
                <li key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-mono truncate max-w-[200px]">{p.path}</span>
                    <span className="text-xs text-gray-500 tabular-nums ml-2">{p.views.toLocaleString("fr-FR")}</span>
                  </div>
                  <progress value={pct} max={100} aria-label={`${p.path} : ${pct}%`}
                    className="w-full h-1.5 rounded-full appearance-none [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary" />
                </li>
              )
            })}
          </ul>
        </section>

        {/* Countries */}
        <section aria-label="Pays des visiteurs" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> Pays des visiteurs
          </h3>
          <ul className="space-y-2">
            {countries.map((c, i) => {
              const max = countries[0]?.value || 1
              const pct = Math.round((c.value / max) * 100)
              return (
                <li key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{c.dimension}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{c.value.toLocaleString("fr-FR")}</span>
                  </div>
                  <progress value={pct} max={100} aria-label={`${c.dimension} : ${pct}%`}
                    className="w-full h-1.5 rounded-full appearance-none [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-indigo-500 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-500" />
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}

// ── Add Numbers Section ───────────────────────────────────────────────────────
function AddSection({ username, password, onSuccess }: { username: string; password: string; onSuccess: () => void }) {
  const [phones, setPhones] = useState("")
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AddResult | null>(null)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phones.trim()) return
    setIsLoading(true); setResult(null); setError("")
    try {
      const res = await fetch("/api/admin/add-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, phones: phones.trim(), reason: reason || undefined, customReason: customReason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur serveur"); return }
      setResult(data)
      if (data.summary.added > 0) { setPhones(""); onSuccess() }
    } catch { setError("Impossible de contacter le serveur") }
    finally { setIsLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true"><Plus className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Ajouter des numéros manuellement</h2>
            <p className="text-xs text-gray-400 mt-0.5">Numéros séparés par des virgules — max 100</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-phones" className="block text-sm font-semibold text-gray-700 mb-2">
              Numéros de téléphone <span aria-hidden="true" className="text-primary">*</span>
            </label>
            <textarea id="admin-phones" value={phones} onChange={e => setPhones(e.target.value)}
              placeholder="0550123456, 0661234567, 0771234567" rows={4}
              aria-required="true" aria-describedby="phones-hint"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
            <p id="phones-hint" className="text-xs text-gray-400 mt-1">Format : 0XXXXXXXXX (où le 2ème chiffre est 5, 6 ou 7)</p>
          </div>

          <div>
            <label htmlFor="add-reason-select" className="block text-sm font-semibold text-gray-700 mb-2">
              Raison <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
            </label>
            <select id="add-reason-select" value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
              <option value="">Aucune raison</option>
              {REASONS_FR.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="add-custom-reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
            </label>
            <textarea id="add-custom-reason" value={customReason} onChange={e => setCustomReason(e.target.value)}
              placeholder="Détails supplémentaires..." rows={2} maxLength={200}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
            <p className="text-xs text-gray-400 mt-1 text-right">{customReason.length}/200</p>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
            </div>
          )}

          <button type="submit" disabled={isLoading || !phones.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isLoading
              ? <><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Ajout en cours...</>
              : <><Plus className="h-4 w-4" aria-hidden="true" /> Ajouter les numéros</>}
          </button>

          {result && (
            <div role="status" aria-live="polite" className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Résultat :</p>
              <div className="flex flex-wrap gap-2">
                {result.summary.added > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />{result.summary.added} ajouté{result.summary.added > 1 ? "s" : ""}
                  </span>
                )}
                {result.summary.duplicate > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />{result.summary.duplicate} doublon{result.summary.duplicate > 1 ? "s" : ""}
                  </span>
                )}
                {result.summary.invalid > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />{result.summary.invalid} invalide{result.summary.invalid > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {(result.summary.invalid > 0 || result.summary.duplicate > 0) && (
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {result.results.filter(r => r.status !== "added").map((r, i) => (
                    <li key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${r.status === "invalid" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className="font-mono">{r.phone}</span>
                      <span className="font-medium">{r.status === "invalid" ? "Invalide" : "Doublon (3j)"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Dashboard Section ─────────────────────────────────────────────────────────
function DashboardSection({ stats, isRefreshing, onRefresh }: { stats: AdminStats; isRefreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Données des signalements DzRetour</p>
        <button type="button" onClick={onRefresh} disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" /> Actualiser
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Visiteurs (track)"          value={stats.overview.totalVisits}  color="bg-blue-500" />
        <StatCard icon={Search}     label="Numéros vérifiés"           value={stats.overview.totalChecks}  color="bg-violet-500" />
        <StatCard icon={Phone}      label="Numéros signalés (uniques)" value={stats.overview.uniquePhones} color="bg-primary" />
        <StatCard icon={FileText}   label="Total signalements"         value={stats.overview.totalReports} color="bg-amber-500" />
        <StatCard icon={Clock}      label="Aujourd'hui"                value={stats.overview.today}        color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="7 derniers jours"           value={stats.overview.week}         color="bg-teal-500" />
        <StatCard icon={Activity}   label="30 derniers jours"          value={stats.overview.month}        color="bg-indigo-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Signalements 30 jours" className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Signalements — 30 derniers jours</h3>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{stats.overview.month} signalements</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.dailyChart}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11, fill: "#9ca3af" }} interval={4} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip labelFormatter={fmt} formatter={(v: any) => [v, "Signalements"]}
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} />
              <Area type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} fill="url(#cg)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section aria-label="Raisons de retour" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Raisons</h3>
          {stats.reasons.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={stats.reasons} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {stats.reasons.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, "signalements"]}
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 mt-2">
                {stats.reasons.map((r, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />
                      {r.name}
                    </span>
                    <span className="font-semibold text-gray-800 ml-2 tabular-nums">{r.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-gray-400 text-sm text-center py-10">Aucune donnée</p>}
        </section>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Numéros les plus signalés" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-gray-900">Numéros les plus signalés</h3>
          </div>
          <ol className="space-y-2">
            {stats.topNumbers.length === 0
              ? <li className="text-gray-400 text-sm">Aucune donnée</li>
              : stats.topNumbers.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span aria-label={`Rang ${i + 1}`} className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? "bg-primary text-white" : i === 1 ? "bg-amber-100 text-amber-700" : i === 2 ? "bg-gray-100 text-gray-600" : "text-gray-400 bg-gray-50"}`}>{i + 1}</span>
                  <span className="font-mono text-sm text-gray-700 flex-1">{item.phone}</span>
                  <span className="text-xs font-semibold bg-red-50 text-primary px-2 py-1 rounded-lg">{item.count}×</span>
                </li>
              ))}
          </ol>
        </section>

        <section aria-label="Pays des reporters" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-gray-900">Pays des reporters</h3>
          </div>
          <ul className="space-y-3">
            {stats.countries.length === 0
              ? <li className="text-gray-400 text-sm">Aucune donnée</li>
              : stats.countries.map((item, i) => {
                const pct = Math.round((item.count / (stats.countries[0]?.count || 1)) * 100)
                return (
                  <li key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{item.country || "Inconnu"}</span>
                      <span className="text-xs text-gray-500 tabular-nums">{item.count}</span>
                    </div>
                    <progress value={pct} max={100} aria-label={`${item.country || "Inconnu"} : ${pct}%`}
                      className="w-full h-1.5 rounded-full appearance-none [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary" />
                  </li>
                )
              })}
          </ul>
        </section>

        <section aria-label="Signalements récents" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-gray-900">Signalements récents</h3>
          </div>
          <ul className="space-y-2">
            {stats.recentReports.length === 0
              ? <li className="text-gray-400 text-sm">Aucun signalement</li>
              : stats.recentReports.map((r, i) => (
                <li key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-semibold text-gray-800">{r.phone}</span>
                    {r.country && <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{r.country}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1 truncate">{r.reason}{r.customReason ? ` — ${r.customReason}` : ""}</p>
                  <p className="text-xs text-gray-400">{fmtDT(r.createdAt)}</p>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
type Tab = "analytics" | "add" | "dashboard"

export default function AdminPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("analytics")

  useEffect(() => {
    const session = loadSession()
    if (session) { fetchStats(session.username, session.password, false, true) }
    else { setIsCheckingSession(false) }
  }, [])

  async function fetchStats(user: string, pwd: string, refreshing = false, silent = false) {
    if (!silent) { refreshing ? setIsRefreshing(true) : setIsLoading(true) }
    setError("")
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pwd }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (silent) { clearSession(); setIsCheckingSession(false); return }
        setError(res.status === 401 ? "Identifiants incorrects" : `Erreur : ${data.error || "Serveur indisponible"}`)
        return
      }
      setStats(data); setIsAuthenticated(true); setLastUpdated(new Date())
    } catch {
      if (silent) { setIsCheckingSession(false); return }
      setError("Impossible de contacter le serveur")
    } finally {
      if (!silent) { setIsLoading(false); setIsRefreshing(false) }
      setIsCheckingSession(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    if (rememberMe) saveSession(username, password)
    fetchStats(username, password)
  }

  function handleLogout() { clearSession(); setIsAuthenticated(false); setStats(null); setUsername(""); setPassword("") }

  // ── Checking session ────────────────────────────────────────────────────────
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
          <p className="text-gray-500 text-sm">Vérification de la session...</p>
        </div>
      </div>
    )
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4" aria-hidden="true"><Shield className="h-8 w-8 text-primary" /></div>
            <h1 className="text-2xl font-bold text-gray-900">Espace Admin</h1>
            <p className="text-gray-500 text-sm mt-1">DzRetour — Tableau de bord</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-semibold text-gray-700 mb-2">Nom d'utilisateur</label>
                <input id="admin-username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoComplete="username"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" autoComplete="current-password"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer" : "Afficher"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="remember-me" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer flex-shrink-0" />
                <label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer select-none">
                  Rester connecté pendant <span className="font-semibold text-gray-800">3 jours</span>
                </label>
              </div>
              {error && (
                <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
                </div>
              )}
              <button type="submit" disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {isLoading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />Connexion...</span> : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "analytics", label: "Google Analytics", icon: BarChart2 },
    { id: "add",       label: "Ajouter des numéros", icon: Plus },
    { id: "dashboard", label: "Signalements",        icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DzRetour Admin</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Dernière sync : {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <button type="button" onClick={handleLogout} aria-label="Se déconnecter"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-100">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "analytics" && <GASection username={username} password={password} />}
        {activeTab === "add"       && <AddSection username={username} password={password} onSuccess={() => { fetchStats(username, password, true); setActiveTab("dashboard") }} />}
        {activeTab === "dashboard" && stats && <DashboardSection stats={stats} isRefreshing={isRefreshing} onRefresh={() => fetchStats(username, password, true)} />}
      </div>
    </div>
  )
}