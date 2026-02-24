import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ConfidenceIndicatorProps {
  confidence: number
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
}

export function ConfidenceIndicator({ confidence, showDetails = false, size = "md" }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 95) return { level: "High Certainty", color: "bg-[#25423D]/10 text-[#25423D]", icon: TrendingUp }
    if (confidence >= 85) return { level: "Good Certainty", color: "bg-yellow-100 text-yellow-800", icon: Minus }
    return { level: "Review Advised", color: "bg-red-100 text-red-800", icon: TrendingDown }
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
    <div className="flex flex-col items-center space-y-5">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background Ring and Fill */}
        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="#FAF9F6"
            stroke="#EEECE6"
            strokeWidth="6"
          />
          {/* Progress Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="#25423D"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-normal text-[#25423D] leading-none mb-0.5" style={{ fontFamily: 'var(--font-playfair), serif' }}>{confidence}</span>
          <span className="text-[10px] font-bold text-[#9A9488] uppercase tracking-tighter">%</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`${confidenceInfo.color} font-bold uppercase tracking-widest text-[9px] px-2.5 py-0.5 border-none shadow-sm`}>
            {confidenceInfo.level}
          </Badge>
        </div>
        <span className="text-[11px] font-bold text-[#9A9488] uppercase tracking-widest">Confidence Score</span>

        {showDetails && (
          <p className="text-[13px] text-center text-[#4A4A4A] mt-3 max-w-[280px] leading-relaxed italic">
            {confidence >= 95 && "Strategic analysis suggests high alignment with local planning policy."}
            {confidence >= 85 && confidence < 95 && "Analysis indicates alignment, with minor policy complexities noted."}
            {confidence < 85 && "Significant policy variables require expert professional review."}
          </p>
        )}
      </div>
    </div>
  )
}
