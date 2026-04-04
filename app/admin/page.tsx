// 📁 EMPLACEMENT : app/admin/page.tsx  (remplace l'existant)
"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import {
  Shield, TrendingUp, AlertTriangle, Clock, Phone,
  MapPin, FileText, LogOut, RefreshCw, Eye, EyeOff,
  Activity, Users, Search, Plus, CheckCircle, XCircle, ChevronDown,
} from "lucide-react"

interface AdminStats {
  overview: {
    totalReports: number; uniquePhones: number; today: number
    week: number; month: number; totalChecks: number; totalVisits: number
  }
  reasons: { name: string; count: number }[]
  topNumbers: { phone: string; count: number }[]
  recentReports: { phone: string; reason: string; customReason?: string; country?: string; city?: string; createdAt: string }[]
  dailyChart: { date: string; count: number }[]
  countries: { country: string; count: number }[]
}

interface AddResult {
  summary: { total: number; added: number; invalid: number; duplicate: number }
  results: { phone: string; status: "added" | "invalid" | "duplicate" }[]
}

const COLORS = ["#dc2626", "#f59e0b", "#6366f1", "#10b981", "#8b5cf6", "#f43f5e"]

const REASONS_FR = [
  "Insatisfaction produit",
  "Refus d'ouvrir le colis",
  "Colis endommagé à la livraison",
  "Changement d'avis du client",
  "Autre",
]

function fmt(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}
function fmtDT(s: string) {
  return new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <div className={`p-2.5 rounded-xl ${color} inline-flex`} aria-hidden="true">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value.toLocaleString("fr-FR")}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  )
}

// ── Add Numbers Panel ───────────────────────────────────────────────────────
function AddNumbersPanel({ username, password, onSuccess }: { username: string; password: string; onSuccess: () => void }) {
  const [phones, setPhones] = useState("")
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AddResult | null>(null)
  const [error, setError] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isOther = reason === "Autre"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phones.trim() || !reason) return
    setIsLoading(true)
    setResult(null)
    setError("")

    try {
      const res = await fetch("/api/admin/add-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username, password,
          phones: phones.trim(),
          reason,
          customReason: isOther ? customReason : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur serveur"); return }
      setResult(data)
      if (data.summary.added > 0) {
        setPhones("")
        onSuccess()
      }
    } catch {
      setError("Impossible de contacter le serveur")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section aria-label="Ajouter des numéros manuellement" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Ajouter des numéros</h2>
          <p className="text-xs text-gray-400 mt-0.5">Entrez un ou plusieurs numéros séparés par des virgules</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone numbers textarea */}
        <div>
          <label htmlFor="admin-phones" className="block text-sm font-semibold text-gray-700 mb-2">
            Numéros de téléphone <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="admin-phones"
            value={phones}
            onChange={e => setPhones(e.target.value)}
            placeholder="0550123456, 0661234567, 0771234567"
            rows={3}
            aria-required="true"
            aria-describedby="phones-hint"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
          <p id="phones-hint" className="text-xs text-gray-400 mt-1">
            Format : 0XXXXXXXXX — plusieurs numéros séparés par des virgules (max 100)
          </p>
        </div>

        {/* Reason dropdown */}
        <div>
          <label id="add-reason-label" className="block text-sm font-semibold text-gray-700 mb-2">
            Raison <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              aria-labelledby="add-reason-label"
              aria-expanded={dropdownOpen ? "true" : "false"}
              aria-haspopup="listbox"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <span className={reason ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                {reason || "Choisir une raison"}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            {dropdownOpen && (
              <ul role="listbox" aria-labelledby="add-reason-label" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {REASONS_FR.map(r => (
                  <li
                    key={r}
                    role="option"
                    aria-selected={reason === r ? "true" : "false"}
                    tabIndex={0}
                    onClick={() => { setReason(r); setDropdownOpen(false) }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setReason(r); setDropdownOpen(false) } }}
                    className={`text-left px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 focus:outline-none focus:bg-gray-50 ${reason === r ? "bg-primary/5 text-primary font-medium" : "text-gray-700"}`}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Custom reason */}
        {isOther && (
          <div>
            <label htmlFor="add-custom-reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Précision (optionnel)
            </label>
            <textarea
              id="add-custom-reason"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Décrivez la raison..."
              rows={2}
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !phones.trim() || !reason}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
        >
          {isLoading ? (
            <><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Ajout en cours...</>
          ) : (
            <><Plus className="h-4 w-4" aria-hidden="true" /> Ajouter les numéros</>
          )}
        </button>

        {/* Results */}
        {result && (
          <div role="status" aria-live="polite" className="space-y-3">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {result.summary.added} ajouté{result.summary.added > 1 ? "s" : ""}
              </span>
              {result.summary.duplicate > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {result.summary.duplicate} doublon{result.summary.duplicate > 1 ? "s" : ""}
                </span>
              )}
              {result.summary.invalid > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {result.summary.invalid} invalide{result.summary.invalid > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Per-number details if there are failures */}
            {(result.summary.invalid > 0 || result.summary.duplicate > 0) && (
              <ul className="space-y-1 max-h-36 overflow-y-auto">
                {result.results.filter(r => r.status !== "added").map((r, i) => (
                  <li key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${r.status === "invalid" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                    <span className="font-mono">{r.phone}</span>
                    <span className="font-medium">{r.status === "invalid" ? "Invalide" : "Doublon (24h)"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </section>
  )
}

// ── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchStats(user: string, pwd: string, refreshing = false) {
    refreshing ? setIsRefreshing(true) : setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pwd }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 401 ? "Identifiants incorrects" : `Erreur : ${data.error || "Serveur indisponible"}`)
        return
      }
      setStats(data)
      setIsAuthenticated(true)
      setLastUpdated(new Date())
    } catch {
      setError("Impossible de contacter le serveur")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4" aria-hidden="true">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Espace Admin</h1>
            <p className="text-gray-500 text-sm mt-1">DzRetour — Tableau de bord</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form
              onSubmit={e => { e.preventDefault(); if (username.trim() && password.trim()) fetchStats(username, password) }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="admin-username" className="block text-sm font-semibold text-gray-700 mb-2">Nom d'utilisateur</label>
                <input
                  id="admin-username" type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin" autoComplete="username"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    id="admin-password" type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" autoComplete="current-password"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />Connexion...</span> : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg" aria-hidden="true">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-gray-900">DzRetour Admin</span>
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:inline" aria-live="polite">
                — Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchStats(username, password, true)}
              disabled={isRefreshing}
              aria-label="Actualiser les statistiques"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsAuthenticated(false); setStats(null); setUsername(""); setPassword("") }}
              aria-label="Se déconnecter"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            {/* ── Add Numbers Panel ── */}
            <AddNumbersPanel
              username={username}
              password={password}
              onSuccess={() => fetchStats(username, password, true)}
            />

            {/* ── Overview cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users}      label="Visiteurs du site"           value={stats.overview.totalVisits}  color="bg-blue-500" />
              <StatCard icon={Search}     label="Numéros vérifiés"            value={stats.overview.totalChecks}  color="bg-violet-500" />
              <StatCard icon={Phone}      label="Numéros signalés (uniques)"  value={stats.overview.uniquePhones} color="bg-primary" />
              <StatCard icon={FileText}   label="Total signalements"          value={stats.overview.totalReports} color="bg-amber-500" />
              <StatCard icon={Clock}      label="Aujourd'hui"                 value={stats.overview.today}        color="bg-emerald-500" />
              <StatCard icon={TrendingUp} label="7 derniers jours"            value={stats.overview.week}         color="bg-teal-500" />
              <StatCard icon={Activity}   label="30 derniers jours"           value={stats.overview.month}        color="bg-indigo-500" />
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <section aria-label="Activité des 30 derniers jours" className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">Activité — 30 derniers jours</h2>
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
                <h2 className="text-base font-bold text-gray-900 mb-4">Raisons de retour</h2>
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

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section aria-label="Numéros les plus signalés" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-base font-bold text-gray-900">Numéros les plus signalés</h2>
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
                  <h2 className="text-base font-bold text-gray-900">Pays des reporters</h2>
                </div>
                <ul className="space-y-3">
                  {stats.countries.length === 0
                    ? <li className="text-gray-400 text-sm">Aucune donnée géographique</li>
                    : stats.countries.map((item, i) => {
                      const pct = Math.round((item.count / (stats.countries[0]?.count || 1)) * 100)
                      return (
                        <li key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 font-medium">{item.country || "Inconnu"}</span>
                            <span className="text-xs text-gray-500 tabular-nums">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </section>

              <section aria-label="Signalements récents" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-base font-bold text-gray-900">Signalements récents</h2>
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
          </>
        )}
      </div>
    </div>
  )
}