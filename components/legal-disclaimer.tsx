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
      <Alert className="bg-[#F8F7F3] border-[#EEECE6] flex justify-center items-center gap-2 [&>svg]:static [&>svg]:transform-none [&>svg]:left-auto [&>svg]:top-auto [&>svg~*]:pl-0 shadow-none">
        <Shield className="h-4 w-4 text-[#253325]" />
        <AlertDescription className="text-xs">
          <span className="font-semibold uppercase tracking-widest text-[#9A9488]">
            <Link href="/legal-notice" className="hover:text-[#253325] transition-colors underline underline-offset-4">
              Legal Notice & Disclaimer</Link>
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Legal Notice */}
      <Card className="bg-[#FAF9F6] border-[#EEECE6] shadow-none">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-xl font-normal text-[#253325] flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
            <Scale className="w-5 h-5 text-[#9A9488]" />
            Important Legal Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[13px] text-[#4A4A4A] px-6 pb-6">
          <div className="space-y-1.5">
            <p className="font-bold text-[#253325] uppercase tracking-wider text-[11px]">Accuracy and Limitations</p>
            <p className="leading-relaxed">
              This tool provides a {confidence}% accuracy rating based on publicly available planning data. While we
              strive for accuracy, planning law is complex and subject to frequent changes. This tool should be used for
              initial guidance only.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-[#253325] uppercase tracking-wider text-[11px]">Not Professional Advice</p>
            <p className="leading-relaxed">
              The information provided is not professional planning or legal advice. It does not constitute a formal
              planning assessment and should not be relied upon for making final development decisions.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-[#253325] uppercase tracking-wider text-[11px]">Recommendation</p>
            <p className="leading-relaxed font-medium">
              We strongly recommend seeking official pre-planning advice from your
              local authority or a qualified professional before proceeding with any development.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Explanation */}
      <Card className="border-[#EEECE6] shadow-none">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-xl font-normal text-[#253325] flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
            <Info className="w-5 h-5 text-[#9A9488]" />
            Understanding Confidence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-[13px] text-[#4A4A4A] px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="font-bold text-green-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                95-99.8% CERTAINTY
              </div>
              <p className="leading-snug text-[#666]">High confidence based on clear, recent data with no conflicting information.</p>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-yellow-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                85-94% CERTAINTY
              </div>
              <p className="leading-snug text-[#666]">Good confidence but some data limitations or complex constraints present.</p>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-red-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                75-84% CERTAINTY
              </div>
              <p className="leading-snug text-[#666]">Lower confidence due to data gaps, complex factors, or conflicting info.</p>
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
