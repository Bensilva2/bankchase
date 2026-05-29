"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts"
import { AlertTriangle, Shield, Activity, TrendingUp, RefreshCw, Clock, User } from "lucide-react"
import type { BehavioralBaseline, DeviationRecord } from "@/lib/drift-detection-service"

interface DriftStats {
  total_sessions: number
  drift_detected_count: number
  risk_distribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  action_distribution: {
    enroll: number
    normal_update: number
    adaptive_update: number
    flag_review: number
    escalate: number
  }
  drift_rate: string
}

interface DriftTrend {
  date: string
  total: number
  drift_count: number
  avg_drift_score: number
  high_risk_count: number
  drift_rate: number
}

interface AuditLogEntry {
  id: string
  user_id: string
  drift_detected: boolean
  drift_score: number
  action_taken: string
  risk_level: string
  created_at: string
  deviations: Record<string, number>
  session_features: Record<string, number>
}

const chartConfig = {
  drift_rate: {
    label: "Drift Rate",
    color: "hsl(var(--chart-1))",
  },
  avg_drift_score: {
    label: "Avg Drift Score",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total Sessions",
    color: "hsl(var(--chart-3))",
  },
  high_risk_count: {
    label: "High Risk",
    color: "hsl(var(--chart-4))",
  },
}

function getRiskColor(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-500"
    case "high":
      return "bg-orange-500"
    case "medium":
      return "bg-yellow-500"
    case "low":
    default:
      return "bg-green-500"
  }
}

function getRiskBadgeVariant(level: string): "destructive" | "default" | "secondary" | "outline" {
  switch (level) {
    case "critical":
    case "high":
      return "destructive"
    case "medium":
      return "default"
    default:
      return "secondary"
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DriftDetectionDashboard({ userId, orgId = "default" }: { userId?: string; orgId?: string }) {
  const [baseline, setBaseline] = useState<BehavioralBaseline | null>(null)
  const [stats, setStats] = useState<DriftStats | null>(null)
  const [trends, setTrends] = useState<DriftTrend[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch baseline if userId provided
      if (userId) {
        const baselineRes = await fetch(`/api/drift/baseline?user_id=${userId}&org_id=${orgId}`)
        if (baselineRes.ok) {
          const baselineData = await baselineRes.json()
          if (baselineData.exists) {
            setBaseline(baselineData.baseline)
          }
        }
      }

      // Fetch stats
      const statsRes = await fetch("/api/drift/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "stats", 
          user_id: userId, 
          org_id: orgId,
          days: 30 
        }),
      })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      // Fetch trends
      const trendsRes = await fetch("/api/drift/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "trends", 
          user_id: userId, 
          org_id: orgId,
          days: 14 
        }),
      })
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json()
        setTrends(trendsData.trends || [])
      }

      // Fetch recent audit logs
      const logsRes = await fetch(
        `/api/drift/audit?${userId ? `user_id=${userId}&` : ""}org_id=${orgId}&limit=10`
      )
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setRecentLogs(logsData.logs || [])
      }
    } catch (error) {
      console.error("Error fetching drift data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, orgId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Behavioral Drift Detection</h2>
          <p className="text-muted-foreground">
            Voice biometrics analysis and anomaly detection
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.drift_rate || "0%"}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.drift_detected_count || 0} drift events detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.risk_distribution.high || 0) + (stats?.risk_distribution.critical || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baseline Health</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {baseline ? (
              <>
                <div className="text-2xl font-bold">{baseline.sample_count} samples</div>
                <p className="text-xs text-muted-foreground">
                  Confidence: {((baseline.confidence_score || 0.5) * 100).toFixed(0)}%
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground">No baseline found</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Drift Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Drift Rate Trends</CardTitle>
            <CardDescription>Daily drift detection rates over the past 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-64">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="fillDriftRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="drift_rate"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#fillDriftRate)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown of risk levels across all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Low Risk
                    </span>
                    <span className="font-medium">{stats.risk_distribution.low}</span>
                  </div>
                  <Progress 
                    value={stats.total_sessions > 0 ? (stats.risk_distribution.low / stats.total_sessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      Medium Risk
                    </span>
                    <span className="font-medium">{stats.risk_distribution.medium}</span>
                  </div>
                  <Progress 
                    value={stats.total_sessions > 0 ? (stats.risk_distribution.medium / stats.total_sessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      High Risk
                    </span>
                    <span className="font-medium">{stats.risk_distribution.high}</span>
                  </div>
                  <Progress 
                    value={stats.total_sessions > 0 ? (stats.risk_distribution.high / stats.total_sessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      Critical Risk
                    </span>
                    <span className="font-medium">{stats.risk_distribution.critical}</span>
                  </div>
                  <Progress 
                    value={stats.total_sessions > 0 ? (stats.risk_distribution.critical / stats.total_sessions) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No stats available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Baseline Details */}
      {baseline && (
        <Card>
          <CardHeader>
            <CardTitle>Current Baseline</CardTitle>
            <CardDescription>
              Behavioral feature values from {baseline.sample_count} voice samples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Pause Duration</p>
                <p className="text-xl font-semibold">{baseline.avg_pause_duration.toFixed(3)}s</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pitch Variation</p>
                <p className="text-xl font-semibold">{(baseline.pitch_variation * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Response Latency</p>
                <p className="text-xl font-semibold">{baseline.response_latency_mean.toFixed(2)}s</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Speaking Tempo</p>
                <p className="text-xl font-semibold">{baseline.tempo_wpm.toFixed(0)} WPM</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Disfluency Rate</p>
                <p className="text-xl font-semibold">{(baseline.disfluency_rate * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last updated: {formatTimestamp(baseline.updated_at)}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Drift Score: {baseline.drift_score.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest drift detection events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${getRiskColor(log.risk_level)}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {log.drift_detected ? "Drift Detected" : "Normal Session"}
                        </span>
                        <Badge variant={getRiskBadgeVariant(log.risk_level)}>
                          {log.risk_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Action: {log.action_taken} | Score: {log.drift_score.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
