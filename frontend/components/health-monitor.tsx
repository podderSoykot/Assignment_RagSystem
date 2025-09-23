"use client"

import { useState, useEffect } from "react"
import { Activity, CheckCircle, XCircle, Clock, Server, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HealthStatus {
  status: "healthy" | "unhealthy" | "unknown"
  timestamp: string
  details?: Record<string, any>
}

export function HealthMonitor() {
  const [health, setHealth] = useState<HealthStatus>({ status: "unknown", timestamp: "" })
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/health")
      const data = await response.json()

      setHealth({
        status: response.ok ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        details: data,
      })
      setLastChecked(new Date())
    } catch (err) {
      setHealth({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        details: { error: err instanceof Error ? err.message : "Connection failed" },
      })
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (health.status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusBadge = () => {
    switch (health.status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Healthy</Badge>
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-balance">System Health Monitor</h2>
        <p className="text-muted-foreground text-pretty">Monitor the health and status of your Bengali RAG API</p>
      </div>

      {/* Health Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              API Health Status
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button onClick={checkHealth} disabled={loading} variant="outline" size="sm">
                {loading ? "Checking..." : "Refresh"}
              </Button>
            </div>
          </div>
          <CardDescription>{lastChecked && <>Last checked: {lastChecked.toLocaleString()}</>}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Overview */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                {getStatusIcon()}
                <div>
                  <h3 className="font-semibold">API Server</h3>
                  <p className="text-sm text-muted-foreground">
                    {health.status === "healthy"
                      ? "Running normally"
                      : health.status === "unhealthy"
                        ? "Connection failed"
                        : "Status unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Endpoint</h3>
                  <p className="text-sm text-muted-foreground font-mono">http://127.0.0.1:8000</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                <Wifi className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    {health.status === "healthy" ? "Connected" : "Disconnected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Health Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Health Details</h3>
              {health.details ? (
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-auto">{JSON.stringify(health.details, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No additional details available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {health.status === "unhealthy" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            The API server appears to be down or unreachable. Please check if the server is running on 127.0.0.1:8000.
          </AlertDescription>
        </Alert>
      )}

      {health.status === "healthy" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>All systems are operational. The Bengali RAG API is responding normally.</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common health monitoring tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button variant="outline" onClick={checkHealth} disabled={loading}>
              <Activity className="w-4 h-4 mr-2" />
              Check Health
            </Button>
            <Button variant="outline" onClick={() => window.open("http://127.0.0.1:8000/health", "_blank")}>
              <Server className="w-4 h-4 mr-2" />
              View Raw Response
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Wifi className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
