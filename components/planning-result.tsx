import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, MapPin } from "lucide-react"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { ConfidenceIndicator } from "@/components/confidence-indicator"

<<<<<<< HEAD
// export interface PlanningCheck {
//   type: string
//   status: "pass" | "fail" | "warning"
//   description: string
// }
=======
>>>>>>> 7826c29004a072c5004ccc592d62187b0643bca7
export interface PlanningCheck {
  type: string
  status: "pass" | "fail" | "warning"
  description: string
<<<<<<< HEAD
  documentationUrl?: string
}
=======
}

>>>>>>> 7826c29004a072c5004ccc592d62187b0643bca7
export interface PlanningResult {
  address: string
  hasPermittedDevelopmentRights: boolean
  confidence: number
  localAuthority: string
  checks: PlanningCheck[]
  summary: string
}

interface PlanningResultProps {
  result: PlanningResult
}

export function PlanningResult({ result }: PlanningResultProps) {
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
          <ConfidenceIndicator confidence={result.confidence} showDetails={true} />
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
<<<<<<< HEAD
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
=======
>>>>>>> 7826c29004a072c5004ccc592d62187b0643bca7
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
<<<<<<< HEAD
            ))} */}
=======
            ))}
>>>>>>> 7826c29004a072c5004ccc592d62187b0643bca7
          </div>
        </CardContent>
      </Card>

      <LegalDisclaimer confidence={result.confidence} variant="full" />
    </div>
  )
}
