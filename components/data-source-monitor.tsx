"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { type DataSource, advancedDataIntegration } from "@/lib/advanced-data-sources"

export function DataSourceMonitor() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSourceStatus = async () => {
    setLoading(true)
    try {
      const sourceStatus = await advancedDataIntegration.getDataSourceStatus()
      setSources(sourceStatus)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to fetch source status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSourceStatus()
    const interval = setInterval(fetchSourceStatus, 10000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Data Source Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSourceStatus}
          disabled={loading}
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</div>

          <div className="grid gap-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  {getStatusIcon(source.status)}
                  <div>
                    <div className="font-medium">{source.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.rateLimit} req/min • {Math.round(source.reliability * 100)}% reliable
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(source.status)}>{source.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sources.filter((s) => s.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {sources.filter((s) => s.status === "maintenance").length}
                </div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {sources.filter((s) => s.status === "error").length}
                </div>
                <div className="text-sm text-muted-foreground">Error</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
