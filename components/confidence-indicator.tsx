import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ConfidenceIndicatorProps {
  confidence: number
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
}

export function ConfidenceIndicator({ confidence, showDetails = false, size = "md" }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 95) return { level: "High", color: "bg-green-100 text-green-800", icon: TrendingUp }
    if (confidence >= 85) return { level: "Good", color: "bg-yellow-100 text-yellow-800", icon: Minus }
    return { level: "Lower", color: "bg-red-100 text-red-800", icon: TrendingDown }
  }

  const confidenceInfo = getConfidenceLevel(confidence)
  const Icon = confidenceInfo.icon

  // SVG parameters for the circular gauge
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (confidence / 100) * circumference

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40"
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background Ring and Fill */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="#ebf5ff"
            stroke="#e3f2fd"
            strokeWidth="8"
          />
          {/* Progress Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="#0071eb"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#212121] leading-none mb-1">{confidence}</span>
          <span className="text-xs font-medium text-[#757575]">/100</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Badge className={`${confidenceInfo.color} font-semibold`}>
            <Icon className="w-3 h-3 mr-1" />
            {confidenceInfo.level}
          </Badge>
          <span className="text-sm font-semibold text-foreground">Confidence Score</span>
        </div>

        {showDetails && (
          <p className="text-xs text-center text-muted-foreground mt-2 max-w-[250px]">
            {confidence >= 95 && "High confidence based on comprehensive, up-to-date planning data."}
            {confidence >= 85 && confidence < 95 && "Good confidence with some data limitations or complex constraints."}
            {confidence < 85 && "Lower confidence due to data gaps or complex planning factors."}
          </p>
        )}
      </div>
    </div>
  )
}
