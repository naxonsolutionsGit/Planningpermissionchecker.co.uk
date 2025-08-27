"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, TrendingUp, TrendingDown, Minus, Clock, MapPin, FileText } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import type { PropertyData } from "@/lib/advanced-data-sources"
import { HistoricalDataAnalyzer, type LocalAreaTrends, type PredictiveInsight } from "@/lib/historical-data"

interface HistoricalTimelineProps {
  propertyData: PropertyData
}

export function HistoricalTimeline({ propertyData }: HistoricalTimelineProps) {
  const [timeframe, setTimeframe] = useState("5years")
  const [dataType, setDataType] = useState("applications")
  const [areaTrends, setAreaTrends] = useState<LocalAreaTrends | null>(null)
  const [insights, setInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true)
      try {
        const analyzer = new HistoricalDataAnalyzer(propertyData)
        const trends = await analyzer.getLocalAreaTrends()
        const predictiveInsights = await analyzer.getPredictiveInsights()

        setAreaTrends(trends)
        setInsights(predictiveInsights)
      } catch (error) {
        console.error("Failed to load historical data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHistoricalData()
  }, [propertyData])

  if (loading || !areaTrends) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
          <span>Loading historical data...</span>
        </CardContent>
      </Card>
    )
  }

  const getCurrentTrendData = () => {
    switch (dataType) {
      case "applications":
        return areaTrends.applicationTrends
      case "approvals":
        return areaTrends.approvalRates
      case "property_value":
        return areaTrends.propertyValueImpact
      default:
        return areaTrends.applicationTrends
    }
  }

  const currentTrend = getCurrentTrendData()
  const chartData = currentTrend.data.map((point) => ({
    date: point.date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    value: point.value,
    fullDate: point.date,
  }))

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "stable":
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "approval_likelihood":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "constraint_risk":
        return <MapPin className="h-4 w-4 text-red-600" />
      case "market_trend":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "policy_change":
        return <Calendar className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historical Planning Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze planning trends and patterns for {propertyData.localAuthority}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Data Type:</label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">Planning Applications</SelectItem>
                  <SelectItem value="approvals">Approval Rates</SelectItem>
                  <SelectItem value="property_value">Property Value Index</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Timeframe:</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="3years">3 Years</SelectItem>
                  <SelectItem value="5years">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getTrendIcon(currentTrend.trend)}
              {dataType === "applications" && "Planning Applications Over Time"}
              {dataType === "approvals" && "Approval Rates Over Time"}
              {dataType === "property_value" && "Property Value Index Over Time"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  currentTrend.trend === "increasing"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : currentTrend.trend === "decreasing"
                      ? "bg-red-100 text-red-800 border-red-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {currentTrend.changePercent > 0 ? "+" : ""}
                {currentTrend.changePercent.toFixed(1)}%
              </Badge>
              <Badge variant="outline">{currentTrend.significance} significance</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number) => [
                    dataType === "property_value" ? value.toFixed(1) : value,
                    dataType === "applications"
                      ? "Applications"
                      : dataType === "approvals"
                        ? "Approval Rate %"
                        : "Value Index",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Development Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Development Types (Last 5 Years)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(areaTrends.developmentTypes).map(([type, count]) => ({ type, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Constraint History */}
      <Card>
        <CardHeader>
          <CardTitle>Planning Constraint Changes</CardTitle>
          <p className="text-sm text-muted-foreground">Historical changes to planning constraints in this area</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areaTrends.constraintChanges.map((constraint) => (
              <div key={constraint.constraintId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{constraint.name}</h4>
                    <p className="text-sm text-muted-foreground">{constraint.type.replace(/_/g, " ")}</p>
                  </div>
                  <Badge
                    className={
                      constraint.impact === "high"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : constraint.impact === "medium"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                    }
                  >
                    {constraint.impact} impact
                  </Badge>
                </div>
                <p className="text-sm mb-3">{constraint.reason}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Introduced: {constraint.dateIntroduced.toLocaleDateString()}</span>
                  {constraint.dateRemoved && <span>Removed: {constraint.dateRemoved.toLocaleDateString()}</span>}
                  <span>Affected Properties: {constraint.affectedProperties}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Insights</CardTitle>
          <p className="text-sm text-muted-foreground">AI-powered predictions based on historical trends</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold capitalize">{insight.type.replace(/_/g, " ")}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(insight.confidence)}>
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                    <Badge variant="outline">{insight.timeframe}</Badge>
                  </div>
                </div>
                <p className="text-sm mb-3">{insight.description}</p>
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-1">Key Factors:</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {insight.factors.map((factor, factorIndex) => (
                      <li key={factorIndex} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-muted/50 rounded border-l-4 border-l-primary">
                  <p className="text-sm font-medium">Recommendation:</p>
                  <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
