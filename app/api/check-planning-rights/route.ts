import { type NextRequest, NextResponse } from "next/server"
import { checkPlanningRights } from "@/lib/planning-api"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia" as any,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Missing payment session ID. Payment is required to view results." }, { status: 400 })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment has not been completed." }, { status: 402 })
    }

    // Extract the securely stored address from metadata
    const address = session.metadata?.address
    const latitude = session.metadata?.latitude ? parseFloat(session.metadata.latitude) : undefined;
    const longitude = session.metadata?.longitude ? parseFloat(session.metadata.longitude) : undefined;
    const includeLandRegistry = session.metadata?.includeLandRegistry === "true";

    if (!address) {
      return NextResponse.json({ error: "No address found in the payment session." }, { status: 400 })
    }

    // Proceed with planning check
    const result = await checkPlanningRights(address, latitude, longitude)

    // For the UI to render correctly, also send back the property summary
    let propertySummary = null;
    try {
      const { fetchPropertySummary } = await import("@/lib/property-api");

      // Extract postcode from the address string to pass to our data fetchers
      let postcode = "";
      const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9]?[A-Z]{2}/gi;
      const matches = address.match(postcodeRegex);
      if (matches && matches.length > 0) {
        postcode = matches[matches.length - 1]; // Take the last matched postcode
      }

      propertySummary = await fetchPropertySummary(address, postcode);
    } catch (e) {
      console.warn("Could not fetch property summary attached to payment secure endpoint", e);
    }

    return NextResponse.json({ ...result, propertySummary, includeLandRegistry })
  } catch (error: any) {
    console.error("Planning rights check error:", error)
    return NextResponse.json({ error: error.message || "Failed to check planning rights" }, { status: 500 })
  }
}
