import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, Info, Scale } from "lucide-react"
import Link from "next/link"

interface LegalDisclaimerProps {
  confidence: number
  variant?: "compact" | "full"
}

export function LegalDisclaimer({ confidence, variant = "compact" }: LegalDisclaimerProps) {
  if (variant === "compact") {
    return (
      <Alert className="bg-muted/30 border-muted flex justify-center items-center gap-2 [&>svg]:static [&>svg]:transform-none [&>svg]:left-auto [&>svg]:top-auto [&>svg~*]:pl-0">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <span className="font-medium">
            <Link href="/legal-notice" className="hover:text-foreground transition-colors underline underline-offset-4">
              Legal Notice / Disclaimer:</Link>
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Legal Notice */}
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-muted-foreground" />
            Important Legal Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Accuracy and Limitations</p>
            <p>
              This tool provides a {confidence}% accuracy rating based on publicly available planning data. While we
              strive for accuracy, planning law is complex and subject to frequent changes. This tool should be used for
              initial guidance only.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Not Professional Advice</p>
            <p>
              The information provided is not professional planning or legal advice. It does not constitute a formal
              planning assessment and should not be relied upon for making final development decisions.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Recommendation</p>
            <p>
              For 100% certainty and official confirmation, we strongly recommend seeking pre-planning advice from your
              local planning authority or consulting with a qualified planning professional before proceeding with any
              development.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Explanation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-accent" />
            Understanding Confidence Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="font-medium text-green-700">95-99.8% Confidence</div>
              <p>High confidence based on clear, recent data with no conflicting information.</p>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-yellow-700">85-94% Confidence</div>
              <p>Good confidence but some data limitations or complex planning constraints present.</p>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-red-700">75-84% Confidence</div>
              <p>Lower confidence due to data gaps, complex constraints, or conflicting information.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liability and Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Liability and Terms of Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Limitation of Liability</p>
            <p>
              PlanningCheckers.co.uk and its operators accept no liability for any loss, damage, or expense arising from
              reliance on the information provided by this tool. Users proceed at their own risk.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Data Sources</p>
            <p>
              Information is compiled from publicly available sources including local authority planning portals,
              government databases, and mapping services. Data accuracy depends on the quality and currency of these
              sources.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Changes in Planning Law</p>
            <p>
              Planning legislation and local policies change regularly. Information provided reflects the position at
              the time of checking but may become outdated. Always verify current requirements with your local planning
              authority.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
