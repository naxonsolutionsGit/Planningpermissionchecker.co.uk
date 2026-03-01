import { type NextRequest, NextResponse } from "next/server"
import { checkPlanningRights } from "@/lib/planning-api"

export async function POST(request: NextRequest) {
    try {
        const { address, latitude, longitude } = await request.json()

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 })
        }

        // Fetch full planning data server-side
        const result = await checkPlanningRights(address, latitude, longitude)

        // Fetch property summary for preview (Property Type, Tenure, Local Authority)
        let propertySummary = null;
        try {
            const { fetchPropertySummary } = await import("@/lib/property-api");
            let postcode = "";
            const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9]?[A-Z]{2}/gi;
            const matches = address.match(postcodeRegex);
            if (matches && matches.length > 0) {
                postcode = matches[matches.length - 1];
            }
            propertySummary = await fetchPropertySummary(address, postcode);
        } catch (e) {
            console.warn("Could not fetch property summary for preview", e);
        }

        // Return ONLY preview data - never send full report before payment
        return NextResponse.json({
            preview: {
                address: result.address,
                coordinates: result.coordinates,
                localAuthority: result.localAuthority,
                propertyType: propertySummary?.propertyType || "Residential",
                tenure: propertySummary?.tenure || "Not available",
                hasPermittedDevelopmentRights: result.hasPermittedDevelopmentRights,
                // Include total number of checks found (but NOT the details)
                totalChecks: result.checks?.length || 0,
            }
        })
    } catch (error: any) {
        console.error("Preview fetch error:", error)
        return NextResponse.json({ error: error.message || "Failed to fetch preview data" }, { status: 500 })
    }
}
