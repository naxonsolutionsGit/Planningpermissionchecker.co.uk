import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ConfidenceIndicatorProps {
  confidence: number
  showDetails?: boolean
}

export function ConfidenceIndicator({ confidence, showDetails = false }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 95) return { level: "High", color: "bg-green-100 text-green-800", icon: TrendingUp }
    if (confidence >= 85) return { level: "Good", color: "bg-yellow-100 text-yellow-800", icon: Minus }
    return { level: "Lower", color: "bg-red-100 text-red-800", icon: TrendingDown }
  }

  const confidenceInfo = getConfidenceLevel(confidence)
  const Icon = confidenceInfo.icon

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">Confidence Level</span>
        <div className="flex items-center gap-2">
          <Badge className={confidenceInfo.color}>
            <Icon className="w-3 h-3 mr-1" />
            {confidenceInfo.level}
          </Badge>
          <span className="text-sm font-bold text-accent">{confidence}%</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-accent h-2 rounded-full transition-all duration-300" style={{ width: `${confidence}%` }} />
      </div>
      {showDetails && (
        <p className="text-xs text-muted-foreground">
          {confidence >= 95 && "High confidence based on comprehensive, up-to-date planning data."}
          {confidence >= 85 && confidence < 95 && "Good confidence with some data limitations or complex constraints."}
          {confidence < 85 && "Lower confidence due to data gaps or highly complex planning situation."}
        </p>
      )}
    </div>
  )
}
