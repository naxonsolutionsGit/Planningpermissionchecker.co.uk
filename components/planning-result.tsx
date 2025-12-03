import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, MapPin, History, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { ConfidenceIndicator } from "@/components/confidence-indicator"
import { useState, useEffect, useRef } from "react"

// export interface PlanningCheck {
//   type: string
//   status: "pass" | "fail" | "warning"
//   description: string
// }
// Add these type definitions at the top of your file, before the component
export interface PlanningCheck {
  type: string
  status: "pass" | "fail" | "warning"
  description: string
  documentationUrl: string
  entitiesFound?: number
  allEntities?: any[] // Optional: store all entities for detailed display
}

export interface PlanningResult {
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
  hasPermittedDevelopmentRights: boolean
  confidence?: number
  localAuthority: string
  checks: PlanningCheck[]
  summary: string
}

// Planning Application interface for API data
interface PlanningApplication {
  entity: number
  reference: string
  description: string
  "decision-date": string
  "organisation-entity": string
  "entry-date": string
}

// export interface PlanningCheck {
//   type: string
//   status: "pass" | "fail" | "warning"
//   description: string
//   documentationUrl?: string
// }
// export interface PlanningResult {
//   address: string
//   hasPermittedDevelopmentRights: boolean
//   confidence: number
//   localAuthority: string
//   checks: PlanningCheck[]
//   summary: string
// }

interface PlanningResultProps {
  result: PlanningResult
}

export function PlanningResult({ result }: PlanningResultProps) {
  const [planningApplications, setPlanningApplications] = useState<PlanningApplication[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [showPlanningHistory, setShowPlanningHistory] = useState(false)
  const prevLocalAuthorityRef = useRef<string>("")

  const getStatusIcon = (hasRights: boolean) => {
    return hasRights ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />
  }

  const getStatusColor = (hasRights: boolean) => {
    return hasRights ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
  }

  const getCheckIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "fail":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    }
  }

  // Fetch planning applications when showPlanningHistory is toggled or local authority changes
  useEffect(() => {
    // Check if local authority has changed
    const localAuthorityChanged = prevLocalAuthorityRef.current !== result.localAuthority

    if (localAuthorityChanged) {
      // Reset data when local authority changes
      setPlanningApplications([])
      setApplicationsError(null)
      prevLocalAuthorityRef.current = result.localAuthority

      // Fetch new data if section is expanded
      if (showPlanningHistory && !isLoadingApplications) {
        fetchPlanningApplications()
      }
    } else if (showPlanningHistory && planningApplications.length === 0 && !isLoadingApplications && !applicationsError) {
      // Only fetch if we don't have data and section is expanded
      fetchPlanningApplications()
    }
  }, [showPlanningHistory, result.localAuthority])

  // Function to fetch planning applications from planning.data.gov.uk
  const fetchPlanningApplications = async () => {
    setIsLoadingApplications(true)
    setApplicationsError(null)

    try {
      // First, try to get the local authority entity from the API
      // We'll search for local authorities with a name matching the result
      const localAuthorityName = result.localAuthority
      console.log('🔍 Fetching planning history for local authority:', localAuthorityName)

      // Fetch all local authorities and find matching one
      const laResponse = await fetch(
        `https://www.planning.data.gov.uk/entity.json?dataset=local-authority&limit=400`
      )

      if (!laResponse.ok) throw new Error('Failed to fetch local authorities')

      const laData = await laResponse.json()

      // Improved matching: Try exact match first, then partial match
      console.log('🔍 Searching through', laData.entities.length, 'local authorities')

      // Try exact match first (case-insensitive)
      let matchingLA = laData.entities.find((la: any) =>
        la.name.toLowerCase() === localAuthorityName.toLowerCase()
      )

      // If no exact match, try partial match with better scoring
      if (!matchingLA) {
        // Find all potential matches
        const potentialMatches = laData.entities.filter((la: any) => {
          const laNameLower = la.name.toLowerCase()
          const searchNameLower = localAuthorityName.toLowerCase()

          // Both directions of partial matching
          return laNameLower.includes(searchNameLower) || searchNameLower.includes(laNameLower)
        })

        console.log('💡 Found', potentialMatches.length, 'potential matches')

        if (potentialMatches.length > 0) {
          // Score matches - prefer longer matching strings
          const scoredMatches = potentialMatches.map((la: any) => {
            const laNameLower = la.name.toLowerCase()
            const searchNameLower = localAuthorityName.toLowerCase()

            // Calculate similarity score
            let score = 0
            if (laNameLower === searchNameLower) score = 1000 // Exact match
            else if (laNameLower.includes(searchNameLower)) score = searchNameLower.length * 10
            else if (searchNameLower.includes(laNameLower)) score = laNameLower.length * 10

            return { la, score }
          })

          // Sort by score descending and pick best match
          scoredMatches.sort((a: any, b: any) => b.score - a.score)
          matchingLA = scoredMatches[0].la

          console.log('🎯 Best match:', matchingLA.name, '(score:', scoredMatches[0].score, ')')
        }
      } else {
        console.log('🎯 Exact match found:', matchingLA.name)
      }

      if (!matchingLA) {
        console.log('❌ No matching local authority found for:', localAuthorityName)
        setApplicationsError('No planning data available for this local authority yet.')
        setIsLoadingApplications(false)
        return
      }

      console.log('✅ Matched local authority:', matchingLA.name, '(Entity:', matchingLA['organisation-entity'], ')')

      // Fetch planning applications for this authority
      const appsUrl = `https://www.planning.data.gov.uk/entity.json?dataset=planning-application&organisation-entity=${matchingLA['organisation-entity']}&limit=10`
      console.log('📡 Fetching applications from:', appsUrl)

      const appsResponse = await fetch(appsUrl)

      if (!appsResponse.ok) throw new Error('Failed to fetch planning applications')

      const appsData = await appsResponse.json()

      if (appsData.entities && appsData.entities.length > 0) {
        console.log('📋 Found', appsData.entities.length, 'planning applications')

        // Sort by decision date (most recent first)
        const sortedApps = appsData.entities
          .filter((app: PlanningApplication) => app['decision-date']) // Only show apps with decision dates
          .sort((a: PlanningApplication, b: PlanningApplication) => {
            const dateA = new Date(a['decision-date'])
            const dateB = new Date(b['decision-date'])
            return dateB.getTime() - dateA.getTime()
          })
          .slice(0, 5) // Show only 5 most recent

        console.log('✅ Displaying', sortedApps.length, 'most recent applications')
        setPlanningApplications(sortedApps)
      } else {
        setApplicationsError('No planning applications found for this area.')
      }
    } catch (error) {
      console.error('Error fetching planning applications:', error)
      setApplicationsError('Unable to load planning history. Please try again later.')
    } finally {
      setIsLoadingApplications(false)
    }
  }

  // Format date to readable string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date unknown'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Date unknown'
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Main Result Card */}
      <Card className={`${getStatusColor(result.hasPermittedDevelopmentRights)} border-2`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">{getStatusIcon(result.hasPermittedDevelopmentRights)}</div>
          <CardTitle className="text-2xl font-bold">
            {result.hasPermittedDevelopmentRights
              ? "Permitted Development Rights Apply"
              : "Planning Permission Likely Required"}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{result.address}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <ConfidenceIndicator confidence={result.confidence} showDetails={true} /> */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Located in <span className="font-semibold">{result.localAuthority}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Detailed Checks Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planning Checks Performed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {getCheckIcon(check.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{check.type}</span>
                    <Badge
                      variant={
                        check.status === "pass" ? "default" : check.status === "fail" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {check.status === "pass"
                        ? "Clear"
                        : check.status === "fail"
                          ? "Restriction Found"
                          : "Check Required"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
                  {check.documentationUrl && (
                    <a
                      href={check.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View official documentation
                    </a>
                  )}
                </div>
              </div>
            ))}
            {/* {result.checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {getCheckIcon(check.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{check.type}</span>
                    <Badge
                      variant={
                        check.status === "pass" ? "default" : check.status === "fail" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {check.status === "pass"
                        ? "Clear"
                        : check.status === "fail"
                          ? "Restriction Found"
                          : "Check Required"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                </div>
              </div>
            ))} */}
          </div>
        </CardContent>
      </Card>

      {/* Planning History Card - NEW */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowPlanningHistory(!showPlanningHistory)}
            className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#1E7A6F]" />
              <CardTitle className="text-lg">Planning History - Recent Applications in Your Area</CardTitle>
            </div>
            {showPlanningHistory ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {showPlanningHistory && (
          <CardContent>
            {isLoadingApplications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#1E7A6F] mr-2" />
                <span className="text-sm text-muted-foreground">Loading planning applications...</span>
              </div>
            ) : applicationsError ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{applicationsError}</p>
              </div>
            ) : planningApplications.length > 0 ? (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> These are recent planning applications from {result.localAuthority}, not necessarily for this specific address.
                    This gives you an idea of planning activity in your area.
                  </p>
                </div>

                <div className="space-y-3" key={`planning-apps-${result.localAuthority}`}>
                  {planningApplications.map((app, index) => (
                    <div
                      key={`${result.localAuthority}-${app.entity || app.reference || index}`}
                      className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-mono">
                              {app.reference}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-800">
                              {result.localAuthority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Decided: {formatDate(app['decision-date'])}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{app.description || 'No description available'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>


              </>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* <LegalDisclaimer confidence={result.confidence} variant="full" /> */}
    </div>
  )
}
