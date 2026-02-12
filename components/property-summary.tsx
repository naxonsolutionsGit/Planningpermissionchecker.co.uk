import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Calendar, Tag, Bed, Bath, Hash } from "lucide-react"

export interface PropertySummaryProps {
    data: {
        propertyType: string
        bedrooms: number | string
        bathrooms: number | string
        tenure: string
        lastSoldPrice: string
        lastSoldDate: string
    }
    pdRightsApply?: boolean
}

export function PropertySummary({ data, pdRightsApply = true }: PropertySummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">Type</span>
                                <div className="text-sm font-medium text-foreground capitalize">{String(data.propertyType || 'Residential Property')}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">Tenure</span>
                                <div className="text-sm font-medium text-foreground">{String(data.tenure || 'Information Unavailable')}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">Bedrooms</span>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{String(data.bedrooms || 'Information Unavailable')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">Bathrooms</span>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{String(data.bathrooms || 'Information Unavailable')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-border">
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">Last Sold Transaction</span>
                            <div className="text-2xl font-bold text-foreground">{String(data.lastSoldPrice || 'Market Estimate Unavailable')}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Sold on <span className="text-foreground">{String(data.lastSoldDate || 'No recent transaction info')}</span></span>
                            </div>
                        </div>
                        {/* <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Data sourced from HM Land Registry Price Paid Data and Energy Performance Certificate (EPC) Open Data.
                        </p> */}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
