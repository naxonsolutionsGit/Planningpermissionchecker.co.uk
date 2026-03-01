import type { PropertyData } from "./advanced-data-sources"
import type { LocalAreaTrends } from "./historical-data"

export interface AnalyticsMetric {
  id: string
  name: string
  value: number
  change: number
  changeType: "increase" | "decrease" | "stable"
  unit: string
  description: string
  category: "performance" | "planning" | "market" | "system"
}

export interface ChartDataPoint {
  label: string
  value: number
  category?: string
  metadata?: Record<string, any>
}

export interface AnalyticsDashboard {
  kpis: AnalyticsMetric[]
  charts: {
    constraintDistribution: ChartDataPoint[]
    approvalTrends: ChartDataPoint[]
    geographicDistribution: ChartDataPoint[]
    systemPerformance: ChartDataPoint[]
    marketInsights: ChartDataPoint[]
  }
  insights: AnalyticsInsight[]
  lastUpdated: Date
}

export interface AnalyticsInsight {
  id: string
  type: "trend" | "anomaly" | "opportunity" | "risk"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  actionable: boolean
  recommendation?: string
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date
    end: Date
  }
  localAuthorities: string[]
  constraintTypes: string[]
  propertyTypes: string[]
}

export class AnalyticsEngine {
  private data: PropertyData[]
  private trends: LocalAreaTrends[]

  constructor(data: PropertyData[] = [], trends: LocalAreaTrends[] = []) {
    this.data = data
    this.trends = trends
  }

  generateDashboard(filters?: Partial<AnalyticsFilter>): AnalyticsDashboard {
    const filteredData = this.applyFilters(filters)

    return {
      kpis: this.calculateKPIs(filteredData),
      charts: {
        constraintDistribution: this.generateConstraintDistribution(filteredData),
        approvalTrends: this.generateApprovalTrends(),
        geographicDistribution: this.generateGeographicDistribution(filteredData),
        systemPerformance: this.generateSystemPerformance(),
        marketInsights: this.generateMarketInsights(),
      },
      insights: this.generateInsights(filteredData),
      lastUpdated: new Date(),
    }
  }

  private applyFilters(filters?: Partial<AnalyticsFilter>): PropertyData[] {
    if (!filters) return this.generateMockData()

    // In a real implementation, this would filter the actual data
    return this.generateMockData()
  }

  private calculateKPIs(data: PropertyData[]): AnalyticsMetric[] {
    return [
      {
        id: "total_properties",
        name: "Properties Analyzed",
        value: 1247,
        change: 12.5,
        changeType: "increase",
        unit: "properties",
        description: "Total properties analyzed this month",
        category: "performance",
      },
      {
        id: "constraint_rate",
        name: "Constraint Detection Rate",
        value: 34.2,
        change: -1.8,
        changeType: "decrease",
        unit: "%",
        description: "Percentage of properties with planning constraints",
        category: "planning",
      },
      {
        id: "approval_rate",
        name: "Regional Approval Rate",
        value: 78.6,
        change: 0.3,
        changeType: "stable",
        unit: "%",
        description: "Average planning approval rate in analyzed areas",
        category: "planning",
      },
      {
        id: "response_time",
        name: "Average Response Time",
        value: 2.4,
        change: -0.3,
        changeType: "decrease",
        unit: "seconds",
        description: "Average time to complete property analysis",
        category: "system",
      },
      {
        id: "data_freshness",
        name: "Data Freshness",
        value: 96.8,
        change: 1.2,
        changeType: "increase",
        unit: "%",
        description: "Percentage of data sources updated within 24 hours",
        category: "system",
      },
      {
        id: "market_impact",
        name: "Market Value Impact",
        value: 18.7,
        change: 3.4,
        changeType: "increase",
        unit: "%",
        description: "Average property value impact from planning permissions",
        category: "market",
      },
      {
        id: "user_satisfaction",
        name: "User Satisfaction",
        value: 4.6,
        change: 0.2,
        changeType: "increase",
        unit: "/5",
        description: "Average user satisfaction rating",
        category: "performance",
      },
    ]
  }

  private generateConstraintDistribution(data: PropertyData[]): ChartDataPoint[] {
    return [
      { label: "Conservation Areas", value: 28, category: "heritage" },
      { label: "Article 4 Directions", value: 22, category: "restrictions" },
      { label: "Listed Buildings", value: 15, category: "heritage" },
      { label: "Flood Zones", value: 18, category: "environmental" },
      { label: "Green Belt", value: 12, category: "environmental" },
      { label: "Tree Preservation", value: 8, category: "environmental" },
      { label: "National Parks", value: 5, category: "environmental" },
      { label: "Other", value: 12, category: "other" },
    ]
  }

  private generateApprovalTrends(): ChartDataPoint[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((month, index) => ({
      label: month,
      value: 75 + Math.sin((index / 12) * 2 * Math.PI) * 8 + Math.random() * 6,
      metadata: { applications: Math.floor(Math.random() * 50) + 100 },
    }))
  }

  private generateGeographicDistribution(data: PropertyData[]): ChartDataPoint[] {
    return [
      { label: "London", value: 342, category: "major_city" },
      { label: "Manchester", value: 156, category: "major_city" },
      { label: "Birmingham", value: 134, category: "major_city" },
      { label: "Leeds", value: 98, category: "major_city" },
      { label: "Liverpool", value: 87, category: "major_city" },
      { label: "Bristol", value: 76, category: "major_city" },
      { label: "Sheffield", value: 65, category: "major_city" },
      { label: "Newcastle", value: 54, category: "major_city" },
      { label: "Other", value: 235, category: "other" },
    ]
  }

  private generateSystemPerformance(): ChartDataPoint[] {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map((hour) => ({
      label: `${hour}:00`,
      value: Math.max(10, 100 - Math.abs(hour - 14) * 5 + Math.random() * 20),
      metadata: { peak: hour >= 9 && hour <= 17 },
    }))
  }

  private generateMarketInsights(): ChartDataPoint[] {
    return [
      { label: "Extensions", value: 15.2, category: "development_type" },
      { label: "Conversions", value: 22.8, category: "development_type" },
      { label: "New Builds", value: 35.6, category: "development_type" },
      { label: "Change of Use", value: 18.4, category: "development_type" },
      { label: "Demolitions", value: 8.0, category: "development_type" },
    ]
  }

  private generateInsights(data: PropertyData[]): AnalyticsInsight[] {
    return [
      {
        id: "constraint_trend",
        type: "trend",
        title: "Increasing Conservation Area Designations",
        description:
          "15% increase in conservation area constraints over the past 6 months, particularly in urban areas.",
        impact: "medium",
        actionable: true,
        recommendation: "Consider expediting applications in areas under review for conservation status.",
      },
      {
        id: "approval_anomaly",
        type: "anomaly",
        title: "Unusual Approval Rate Drop in Q3",
        description: "Approval rates dropped 12% in Q3 across multiple authorities, potentially due to policy changes.",
        impact: "high",
        actionable: true,
        recommendation: "Review recent policy changes and adjust application strategies accordingly.",
      },
      {
        id: "market_opportunity",
        type: "opportunity",
        title: "High Value Impact in Suburban Extensions",
        description: "Suburban extension projects showing 25% higher value impact than historical average.",
        impact: "high",
        actionable: true,
        recommendation: "Focus marketing efforts on suburban extension opportunities.",
      },
      {
        id: "system_risk",
        type: "risk",
        title: "Data Source Reliability Concerns",
        description: "Two major data sources showing increased latency and occasional outages.",
        impact: "medium",
        actionable: true,
        recommendation: "Implement additional data source redundancy and monitoring.",
      },
    ]
  }

  private generateMockData(): PropertyData[] {
    // Generate mock property data for analytics
    return Array.from({ length: 100 }, (_, i) => ({
      uprn: `${1000000000 + i}`,
      address: `${i + 1} Mock Street, Test City`,
      postcode: `TE${Math.floor(i / 10)}T ${Math.floor(i % 10)}AA`,
      localAuthority: ["London Borough of Test", "Manchester City Council", "Birmingham City Council"][i % 3],
      coordinates: [51.5074 + (Math.random() - 0.5) * 0.1, -0.1278 + (Math.random() - 0.5) * 0.1] as [number, number],
      propertyType: "residential",
      constraints: [],
      planningHistory: [],
      lastUpdated: new Date(),
    }))
  }

  exportAnalytics(format: "csv" | "json" | "pdf"): string {
    const dashboard = this.generateDashboard()

    switch (format) {
      case "json":
        return JSON.stringify(dashboard, null, 2)
      case "csv":
        return this.convertToCSV(dashboard)
      case "pdf":
        return "PDF export would be implemented with a PDF library"
      default:
        return JSON.stringify(dashboard, null, 2)
    }
  }

  private convertToCSV(dashboard: AnalyticsDashboard): string {
    const headers = ["Metric", "Value", "Change", "Unit", "Category"]
    const rows = dashboard.kpis.map((kpi) => [
      kpi.name,
      kpi.value.toString(),
      `${kpi.change > 0 ? "+" : ""}${kpi.change}%`,
      kpi.unit,
      kpi.category,
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }
}
