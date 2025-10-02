import { type NextRequest, NextResponse } from "next/server"
import { checkPlanningRights } from "@/lib/planning-api"

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const result = await checkPlanningRights(address)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Planning rights check error:", error)
    return NextResponse.json({ error: "Failed to check planning rights" }, { status: 500 })
  }
}
