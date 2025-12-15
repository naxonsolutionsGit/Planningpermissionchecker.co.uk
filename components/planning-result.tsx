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
  const prevAddressRef = useRef<string>("")

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

  // Fetch planning applications when showPlanningHistory is toggled or address changes
  useEffect(() => {
    // Check if address has changed
    const addressChanged = prevAddressRef.current !== result.address

    if (addressChanged) {
      // Reset data when address changes
      setPlanningApplications([])
      setApplicationsError(null)
      prevAddressRef.current = result.address

      // Fetch new data if section is expanded
      if (showPlanningHistory && !isLoadingApplications) {
        fetchPlanningApplications()
      }
    } else if (showPlanningHistory && planningApplications.length === 0 && !isLoadingApplications && !applicationsError) {
      // Only fetch if we don't have data and section is expanded
      fetchPlanningApplications()
    }
  }, [showPlanningHistory, result.address])

  // Function to fetch planning applications using UK PlanIt API (much better coverage)
  const fetchPlanningApplications = async () => {
    setIsLoadingApplications(true)
    setApplicationsError(null)

    try {
      // Extract postcode from the address
      const postcodeMatch = result.address.match(/[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}/i)

      if (!postcodeMatch && (!result.coordinates || !result.coordinates.lat || !result.coordinates.lng)) {
        console.log('❌ No postcode or coordinates available')
        setApplicationsError('Unable to search planning history - no postcode or coordinates found.')
        setIsLoadingApplications(false)
        return
      }

      let appsUrl: string

      if (postcodeMatch) {
        // Use postcode search (more accurate for specific address)
        const postcode = postcodeMatch[0].replace(/\s+/g, '+')
        console.log('🔍 Fetching planning history for postcode:', postcode)
        console.log('📍 Address:', result.address)

        // UK PlanIt API - search within 0.1km radius of postcode
        appsUrl = `https://www.planit.org.uk/api/applics/json?pcode=${postcode}&krad=0.1&recent=365&limit=15`
      } else {
        // Fallback to coordinate search
        const { lat, lng } = result.coordinates!
        console.log('🔍 Fetching planning history for coordinates:', lat, lng)

        // UK PlanIt API - search within 0.1km radius of coordinates
        appsUrl = `https://www.planit.org.uk/api/applics/json?lat=${lat}&lng=${lng}&krad=0.1&recent=365&limit=15`
      }

      console.log('📡 Fetching from UK PlanIt:', appsUrl)

      const response = await fetch(appsUrl)

      if (!response.ok) {
        console.log('❌ UK PlanIt API returned error:', response.status)
        throw new Error('Failed to fetch planning applications')
      }

      const data = await response.json()

      // UK PlanIt returns data in a 'records' array
      const applications = data.records || data || []

      if (applications && applications.length > 0) {
        console.log('📋 Found', applications.length, 'planning applications for this address')

        // Sort by start_date or decided_date (most recent first)
        const sortedApps = applications
          .sort((a: any, b: any) => {
            const dateA = new Date(a.decided_date || a.start_date || a.last_changed || '1970-01-01')
            const dateB = new Date(b.decided_date || b.start_date || b.last_changed || '1970-01-01')
            return dateB.getTime() - dateA.getTime()
          })
          .slice(0, 10) // Show up to 10 most recent

        // Map UK PlanIt fields to our interface
        const mappedApps = sortedApps.map((app: any) => ({
          entity: app.uid || app.id,
          reference: app.reference || app.altid || 'Unknown',
          description: app.description || app.name || 'No description available',
          'decision-date': app.decided_date || app.start_date || '',
          'entry-date': app.start_date || app.last_changed || '',
          'organisation-entity': app.area_name || result.localAuthority,
          status: app.status || app.decision || '',
          address: app.address || ''
        }))

        console.log('✅ Displaying', mappedApps.length, 'planning applications')
        setPlanningApplications(mappedApps)
      } else {
        console.log('ℹ️ No planning applications found for this address')
        setApplicationsError('No planning applications found for this address. This may mean no applications have been submitted here recently.')
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
              <CardTitle className="text-lg">Planning History - Applications at This Address</CardTitle>
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
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Found {planningApplications.length} application(s)!</strong> These are planning applications at or near {result.address}.
                    Data sourced from UK PlanIt - the national planning database covering 425 UK councils.
                  </p>
                </div>

                <div className="space-y-3" key={`planning-apps-${result.address}`}>
                  {planningApplications.map((app: any, index) => (
                    <div
                      key={`${result.address}-${app.entity || app.reference || index}`}
                      className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-mono">
                              {app.reference}
                            </Badge>
                            {app.status && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${app.status.toLowerCase().includes('approved') || app.status.toLowerCase().includes('granted')
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : app.status.toLowerCase().includes('refused') || app.status.toLowerCase().includes('rejected')
                                      ? 'bg-red-50 border-red-300 text-red-800'
                                      : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                  }`}
                              >
                                {app.status}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {app['decision-date'] ? `Decided: ${formatDate(app['decision-date'])}` : `Submitted: ${formatDate(app['entry-date'])}`}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-1">{app.description || 'No description available'}</p>
                          {app.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {app.address}
                            </p>
                          )}
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
