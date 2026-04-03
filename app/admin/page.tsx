"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  FileText,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"

interface AdminStats {
  overview: {
    total: number
    today: number
    week: number
    month: number
  }
  reasons: { name: string; count: number }[]
  topNumbers: { phone: string; count: number }[]
  recentReports: {
    phone: string
    reason: string
    customReason?: string
    country?: string
    city?: string
    createdAt: string
  }[]
  dailyChart: { date: string; count: number }[]
  countries: { country: string; count: number }[]
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]

const REASON_LABELS: Record<string, string> = {
  "Product dissatisfaction": "Insatisfaction produit",
  "Refused to open package": "Refus d'ouvrir le colis",
  "Package damaged during delivery": "Colis endommagé",
  "Customer changed mind": "Changement d'avis",
  "Other": "Autre",
  "عدم الرضا عن المنتج": "Insatisfaction produit",
  "رفض فتح الطرد": "Refus d'ouvrir le colis",
  "تلف الطرد أثناء التوصيل": "Colis endommagé",
  "تغيير رأي العميل": "Changement d'avis",
  "أخرى": "Autre",
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Merge duplicate reasons (AR/FR)
function mergeReasons(reasons: { name: string; count: number }[]) {
  const merged: Record<string, number> = {}
  for (const r of reasons) {
    const label = REASON_LABELS[r.name] || r.name
    merged[label] = (merged[label] || 0) + r.count
  }
  return Object.entries(merged)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function fetchStats(pwd: string, refreshing = false) {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setError("Mot de passe incorrect")
        } else {
          setError("Erreur serveur, réessayez")
        }
        return
      }

      setStats(data)
      setIsAuthenticated(true)
    } catch {
      setError("Impossible de contacter le serveur")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    fetchStats(password)
  }

  function handleLogout() {
    setIsAuthenticated(false)
    setStats(null)
    setPassword("")
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg">
            <div className="flex flex-col items-center mb-8">
              <div className="p-4 bg-primary/10 rounded-2xl mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Espace Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">DzRetour — Tableau de bord</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // --- DASHBOARD ---
  const mergedReasons = stats ? mergeReasons(stats.reasons) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">Statistiques en temps réel — DzRetour</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(password, true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 rounded-xl text-sm font-medium hover:bg-card/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>

        {stats && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={FileText}
                label="Total signalements"
                value={stats.overview.total}
                color="bg-indigo-500"
              />
              <StatCard
                icon={Clock}
                label="Aujourd'hui"
                value={stats.overview.today}
                color="bg-violet-500"
              />
              <StatCard
                icon={TrendingUp}
                label="7 derniers jours"
                value={stats.overview.week}
                color="bg-purple-500"
              />
              <StatCard
                icon={AlertTriangle}
                label="30 derniers jours"
                value={stats.overview.month}
                color="bg-fuchsia-500"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Daily bar chart */}
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Signalements — 30 derniers jours
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.dailyChart} barSize={14}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      interval={4}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      labelFormatter={(v) => formatDate(v)}
                      formatter={(v: any) => [v, "Signalements"]}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reasons pie chart */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Raisons
                </h2>
                {mergedReasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={mergedReasons}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={40}
                      >
                        {mergedReasons.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => [v, "signalements"]}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          fontSize: "13px",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => (
                          <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                            {v}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-16">Aucune donnée</p>
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top reported numbers */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Numéros les plus signalés</h2>
                </div>
                <div className="space-y-3">
                  {stats.topNumbers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucune donnée</p>
                  ) : (
                    stats.topNumbers.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-5">
                            {i + 1}
                          </span>
                          <span className="font-mono text-sm text-foreground">{item.phone}</span>
                        </div>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                          {item.count} signalement{item.count > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Countries */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Pays des reporters</h2>
                </div>
                <div className="space-y-3">
                  {stats.countries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucune donnée géographique</p>
                  ) : (
                    stats.countries.map((item, i) => {
                      const max = stats.countries[0]?.count || 1
                      const pct = Math.round((item.count / max) * 100)
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground font-medium">
                              {item.country || "Inconnu"}
                            </span>
                            <span className="text-xs text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Recent reports */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Signalements récents</h2>
                </div>
                <div className="space-y-3">
                  {stats.recentReports.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun signalement</p>
                  ) : (
                    stats.recentReports.map((r, i) => (
                      <div
                        key={i}
                        className="border border-border/40 rounded-xl p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {r.phone}
                          </span>
                          {r.country && (
                            <span className="text-xs text-muted-foreground">{r.country}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {REASON_LABELS[r.reason] || r.reason}
                          {r.customReason && ` — ${r.customReason}`}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {formatDateTime(r.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}