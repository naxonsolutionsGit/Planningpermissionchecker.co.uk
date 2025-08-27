"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, MapPin, FileText, Clock, Download, Share2 } from "lucide-react"
import type { PropertyData } from "@/lib/advanced-data-sources"
import { InteractiveMap } from "./interactive-map"
import { ConfidenceIndicator } from "./confidence-indicator"
import { LegalDisclaimer } from "./legal-disclaimer"
import { ReportGeneratorUI } from "./report-generator-ui"
import { HistoricalTimeline } from "./historical-timeline"

interface EnhancedPlanningResultProps {
  propertyData: PropertyData
  onNewSearch: () => void
}

export function EnhancedPlanningResult({ propertyData, onNewSearch }: EnhancedPlanningResultProps) {
  const [selectedTab, setSelectedTab] = useState("overview")

  // Calculate overall status
  const blockingConstraints = propertyData.constraints.filter((c) => c.severity === "blocking")
  const restrictiveConstraints = propertyData.constraints.filter((c) => c.severity === "restrictive")
  const advisoryConstraints = propertyData.constraints.filter((c) => c.severity === "advisory")

  const overallStatus =
    blockingConstraints.length > 0 ? "blocked" : restrictiveConstraints.length > 0 ? "restricted" : "permitted"

  const overallConfidence =
    propertyData.constraints.length > 0
      ? Math.round(
          (propertyData.constraints.reduce((sum, c) => sum + c.confidence, 0) / propertyData.constraints.length) * 100,
        )
      : 95

  const getStatusIcon = () => {
    switch (overallStatus) {
      case "permitted":
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case "restricted":
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />
      case "blocked":
        return <XCircle className="h-8 w-8 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (overallStatus) {
      case "permitted":
        return "bg-green-50 border-green-200"
      case "restricted":
        return "bg-yellow-50 border-yellow-200"
      case "blocked":
        return "bg-red-50 border-red-200"
    }
  }

  const getStatusText = () => {
    switch (overallStatus) {
      case "permitted":
        return "Permitted Development Rights Apply"
      case "restricted":
        return "Restricted - Some Limitations Apply"
      case "blocked":
        return "Permitted Development Rights Removed"
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className={`${getStatusColor()} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-2xl font-black">{getStatusText()}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {propertyData.address}
                </p>
              </div>
            </div>
            <div className="text-right">
              <ConfidenceIndicator confidence={overallConfidence} size="large" />
              <p className="text-sm text-muted-foreground mt-1">Based on {propertyData.constraints.length} checks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{blockingConstraints.length}</div>
              <div className="text-sm text-muted-foreground">Blocking Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{restrictiveConstraints.length}</div>
              <div className="text-sm text-muted-foreground">Restrictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{advisoryConstraints.length}</div>
              <div className="text-sm text-muted-foreground">Advisory Notes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="history">Planning History</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="reports">Professional Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Property Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>UPRN:</strong> {propertyData.uprn}
                    </div>
                    <div>
                      <strong>Postcode:</strong> {propertyData.postcode}
                    </div>
                    <div>
                      <strong>Property Type:</strong> {propertyData.propertyType}
                    </div>
                    <div>
                      <strong>Local Authority:</strong> {propertyData.localAuthority}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Analysis Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Total Constraints:</strong> {propertyData.constraints.length}
                    </div>
                    <div>
                      <strong>Overall Confidence:</strong> {overallConfidence}%
                    </div>
                    <div>
                      <strong>Last Updated:</strong> {propertyData.lastUpdated.toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Data Sources:</strong> {new Set(propertyData.constraints.map((c) => c.source)).size}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <InteractiveMap propertyData={propertyData} />
        </TabsContent>

        <TabsContent value="constraints" className="space-y-4">
          {propertyData.constraints.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Planning Constraints Found</h3>
                <p className="text-muted-foreground">
                  This property appears to have full Permitted Development rights with no known restrictions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {propertyData.constraints.map((constraint) => (
                <Card key={constraint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{constraint.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{constraint.type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            constraint.severity === "blocking"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : constraint.severity === "restrictive"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {constraint.severity}
                        </Badge>
                        <ConfidenceIndicator confidence={Math.round(constraint.confidence * 100)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{constraint.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <div>
                        <strong>Source:</strong> {constraint.source}
                      </div>
                      <div>
                        <strong>Last Verified:</strong> {constraint.lastVerified.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Planning Application History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertyData.planningHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Planning History Found</h3>
                  <p className="text-muted-foreground">No recent planning applications found for this property.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {propertyData.planningHistory.map((application) => (
                    <div key={application.reference} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{application.reference}</h4>
                          <p className="text-sm text-muted-foreground">{application.description}</p>
                        </div>
                        <Badge
                          className={
                            application.status === "approved"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : application.status === "refused"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : application.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>
                          <strong>Type:</strong> {application.applicationType} - {application.developmentType}
                        </div>
                        <div>
                          <strong>Submitted:</strong> {application.submittedDate.toLocaleDateString()}
                        </div>
                        {application.decisionDate && (
                          <div>
                            <strong>Decision:</strong> {application.decisionDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <HistoricalTimeline propertyData={propertyData} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportGeneratorUI propertyData={propertyData} />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={onNewSearch} variant="outline">
          <MapPin className="h-4 w-4 mr-2" />
          Check Another Property
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
      </div>

      <LegalDisclaimer confidence={overallConfidence} />
    </div>
  )
}
