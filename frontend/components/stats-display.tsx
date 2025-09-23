"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Database, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SystemStats {
  total_documents?: number
  total_queries?: number
  avg_response_time?: number
  uptime?: string
  memory_usage?: number
  cpu_usage?: number
  [key: string]: any
}

export function StatsDisplay() {
  const [stats, setStats] = useState<SystemStats>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/stats")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statistics")
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "N/A"
    return num.toLocaleString()
  }

  const formatBytes = (bytes: number | undefined) => {
    if (bytes === undefined) return "N/A"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A"
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-balance">System Statistics</h2>
        <p className="text-muted-foreground text-pretty">Monitor performance metrics and usage statistics</p>
      </div>

      {/* Refresh Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistics Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <Badge variant="secondary" className="text-xs">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </Badge>
              )}
              <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Error: {error}. Make sure your API server is running on 127.0.0.1:8000.</AlertDescription>
        </Alert>
      )}

      {/* Statistics Grid */}
      {Object.keys(stats).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.total_documents)}</div>
              <p className="text-xs text-muted-foreground">Documents in the knowledge base</p>
            </CardContent>
          </Card>

          {/* Queries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.total_queries)}</div>
              <p className="text-xs text-muted-foreground">Search queries processed</p>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_response_time ? `${stats.avg_response_time.toFixed(0)}ms` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Average query response time</p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          {stats.memory_usage !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats.memory_usage)}</div>
                <p className="text-xs text-muted-foreground">Current memory consumption</p>
              </CardContent>
            </Card>
          )}

          {/* CPU Usage */}
          {stats.cpu_usage !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(stats.cpu_usage)}</div>
                <p className="text-xs text-muted-foreground">Current CPU utilization</p>
              </CardContent>
            </Card>
          )}

          {/* Uptime */}
          {stats.uptime && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uptime}</div>
                <p className="text-xs text-muted-foreground">Time since last restart</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Raw Stats Display */}
      {Object.keys(stats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Statistics Data</CardTitle>
            <CardDescription>Complete statistics response from the API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-sm overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && Object.keys(stats).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Statistics Available</h3>
            <p className="text-muted-foreground">Unable to fetch statistics. Check if the API server is running.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
