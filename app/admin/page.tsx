"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import {
  Shield, TrendingUp, AlertTriangle, Clock, Phone,
  MapPin, FileText, LogOut, RefreshCw, Eye, EyeOff,
  Activity, Users, Search, ChevronUp, ChevronDown,
} from "lucide-react"

interface AdminStats {
  overview: {
    totalReports: number
    uniquePhones: number
    today: number
    week: number
    month: number
    totalChecks: number
    totalVisits: number
  }
  reasons: { name: string; count: number }[]
  topNumbers: { phone: string; count: number }[]
  recentReports: { phone: string; reason: string; customReason?: string; country?: string; city?: string; createdAt: string }[]
  dailyChart: { date: string; count: number }[]
  countries: { country: string; count: number }[]
}

const COLORS = ["#dc2626", "#f59e0b", "#6366f1", "#10b981", "#8b5cf6", "#f43f5e"]

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}
function formatDateTime(s: string) {
  return new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value.toLocaleString("fr-FR")}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

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
        setError(res.status === 401 ? "Identifiants incorrects" : `Erreur: ${data.error || "Serveur indisponible"}`)
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Espace Admin</h1>
            <p className="text-gray-500 text-sm mt-1">DzRetour — Tableau de bord</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form
              onSubmit={(e) => { e.preventDefault(); if (username.trim() && password.trim()) fetchStats(username, password) }}
              className="space-y-4"
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Connexion...
                  </span>
                ) : "Se connecter"}
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
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-gray-900">DzRetour Admin</span>
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                — Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(username, password, true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={() => { setIsAuthenticated(false); setStats(null); setUsername(""); setPassword("") }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            {/* ── Overview cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users}     label="Visiteurs du site"        value={stats.overview.totalVisits}  color="bg-blue-500" />
              <StatCard icon={Search}    label="Numéros vérifiés"         value={stats.overview.totalChecks}  color="bg-violet-500" />
              <StatCard icon={Phone}     label="Numéros signalés (uniques)" value={stats.overview.uniquePhones} color="bg-primary" />
              <StatCard icon={FileText}  label="Total signalements"        value={stats.overview.totalReports} color="bg-amber-500" />
              <StatCard icon={Clock}     label="Aujourd'hui"              value={stats.overview.today}        color="bg-emerald-500" />
              <StatCard icon={TrendingUp} label="7 derniers jours"        value={stats.overview.week}         color="bg-teal-500" />
              <StatCard icon={Activity}  label="30 derniers jours"        value={stats.overview.month}        color="bg-indigo-500" />
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Area chart */}
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">Activité — 30 derniers jours</h2>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
                    {stats.overview.month} signalements
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.dailyChart}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#9ca3af" }} interval={4} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip labelFormatter={formatDate} formatter={(v: any) => [v, "Signalements"]}
                      contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} />
                    <Area type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} fill="url(#cg)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Reasons pie */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
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
                    <div className="space-y-2 mt-2">
                      {stats.reasons.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-gray-600 truncate">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            {r.name}
                          </span>
                          <span className="font-semibold text-gray-800 ml-2 tabular-nums">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-10">Aucune donnée</p>
                )}
              </div>
            </div>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top numbers */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Phone className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Numéros les plus signalés</h2>
                </div>
                <div className="space-y-2">
                  {stats.topNumbers.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucune donnée</p>
                  ) : stats.topNumbers.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? "bg-primary text-white" : i === 1 ? "bg-amber-100 text-amber-700" : i === 2 ? "bg-gray-100 text-gray-600" : "text-gray-400 bg-gray-50"
                      }`}>{i + 1}</span>
                      <span className="font-mono text-sm text-gray-700 flex-1">{item.phone}</span>
                      <span className="text-xs font-semibold bg-red-50 text-primary px-2 py-1 rounded-lg whitespace-nowrap">{item.count}×</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countries */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Pays des reporters</h2>
                </div>
                <div className="space-y-3">
                  {stats.countries.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucune donnée géographique</p>
                  ) : stats.countries.map((item, i) => {
                    const pct = Math.round((item.count / (stats.countries[0]?.count || 1)) * 100)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">{item.country || "Inconnu"}</span>
                          <span className="text-xs text-gray-500 tabular-nums">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent reports */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Signalements récents</h2>
                </div>
                <div className="space-y-2">
                  {stats.recentReports.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucun signalement</p>
                  ) : stats.recentReports.map((r, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-800">{r.phone}</span>
                        {r.country && <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{r.country}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mb-1 truncate">{r.reason}{r.customReason ? ` — ${r.customReason}` : ""}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}