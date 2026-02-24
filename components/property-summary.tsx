import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Calendar, Tag, Bed, Hash, Sofa, Zap } from "lucide-react"

export interface PropertySummaryProps {
    data: {
        propertyType: string
        bedrooms: number | string
        receptions: number | string
        tenure: string
        lastSoldPrice: string
        lastSoldDate: string
        titleNumber?: string
        epcRating?: string
    }
    pdRightsApply?: boolean
}

export function PropertySummary({ data, pdRightsApply = true }: PropertySummaryProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-normal text-[#25423D]" style={{ fontFamily: 'var(--font-playfair), serif' }}>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">Type</span>
                                <div className="text-[15px] font-medium text-[#4A4A4A] capitalize">{String(data.propertyType || 'Residential Property')}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">Tenure</span>
                                <div className="text-[15px] font-medium text-[#4A4A4A]">{String(data.tenure || 'Information Unavailable')}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">Bedrooms</span>
                                <div className="flex items-center gap-1.5 text-[15px] font-medium text-[#4A4A4A]">
                                    <Bed className="h-3.5 w-3.5 text-[#9A9488]" />
                                    <span>{String(data.bedrooms || 'Information Unavailable')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">Receptions</span>
                                <div className="flex items-center gap-1.5 text-[15px] font-medium text-[#4A4A4A]">
                                    <Sofa className="h-3.5 w-3.5 text-[#9A9488]" />
                                    <span>{String(data.receptions || 'Information Unavailable')}</span>
                                </div>
                            </div>
                            {data.epcRating && (
                                <div className="space-y-1">
                                    <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">EPC Rating</span>
                                    <div className="flex items-center gap-1.5 text-[15px] font-medium text-[#4A4A4A]">
                                        <Zap className="h-3.5 w-3.5 text-[#9A9488]" />
                                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold text-white ${['A', 'B'].includes(data.epcRating) ? 'bg-green-600' :
                                            ['C'].includes(data.epcRating) ? 'bg-green-500' :
                                                ['D'].includes(data.epcRating) ? 'bg-yellow-500' :
                                                    'bg-orange-500'
                                            }`}>
                                            Rating: {data.epcRating}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-8 border-[#EEECE6]">
                        <div className="space-y-1">
                            <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">Last Sold Transaction</span>
                            <div className="text-3xl font-normal text-[#25423D]" style={{ fontFamily: 'var(--font-playfair), serif' }}>{String(data.lastSoldPrice || 'Market Estimate Unavailable')}</div>
                            <div className="flex items-center gap-2 text-xs text-[#9A9488]">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Sold on <span className="text-[#4A4A4A]">{String(data.lastSoldDate || 'No recent transaction info')}</span></span>
                            </div>
                        </div>

                        {data.titleNumber && (
                            <div className="space-y-1 pt-3 border-t border-[#EEECE6]">
                                <span className="text-[10px] text-[#9A9488] font-bold uppercase block tracking-wider">HMLR Title Number</span>
                                <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#25423D]">
                                    <Hash className="h-3.5 w-3.5 text-[#9A9488]" />
                                    <span>{String(data.titleNumber)}</span>
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-[#A09A8E] leading-relaxed italic">
                            Data sourced from HM Land Registry Price Paid Data and<br />Energy Performance Certificate (EPC) Open Data.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
