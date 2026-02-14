import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const pcode = searchParams.get("pcode")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const krad = searchParams.get("krad") || "0.2"
    const limit = searchParams.get("limit") || "100"

    let apiUrl = ""
    if (pcode) {
        apiUrl = `https://www.planit.org.uk/api/applics/json?pcode=${pcode}&krad=${krad}&limit=${limit}`
    } else if (lat && lng) {
        apiUrl = `https://www.planit.org.uk/api/applics/json?lat=${lat}&lng=${lng}&krad=${krad}&limit=${limit}`
    } else {
        return NextResponse.json({ error: "Missing required parameters (pcode or lat/lng)" }, { status: 400 })
    }

    try {
        const response = await fetch(apiUrl, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "PlanningChecker/1.0",
            },
        })

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Proxy fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch from planning API" }, { status: 500 })
    }
}
