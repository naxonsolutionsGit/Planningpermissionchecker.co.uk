import { type NextRequest, NextResponse } from "next/server"
import { checkPlanningRights } from "@/lib/planning-api"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia" as any,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, address: reqAddress, latitude: reqLat, longitude: reqLng, email: reqEmail } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Missing payment session ID. Payment is required to view results." }, { status: 400 })
    }

    let address: string | undefined;
    let latitude: number | undefined;
    let longitude: number | undefined;
    let includeLandRegistry = false;
    let customerEmail = "";

    // Check for 100% discount bypass token
    if (sessionId.startsWith("FREE_BYPASS_")) {
      const parts = sessionId.split("_");
      const timestamp = parseInt(parts[2]);
      const signature = parts[3];

      // Simple time-based expiration (e.g., 1 hour)
      if (Date.now() - timestamp > 3600000) {
        return NextResponse.json({ error: "Free session expired. Please try again." }, { status: 402 });
      }

      // Verify signature
      const expectedSignature = Buffer.from(`${timestamp}-${process.env.STRIPE_SECRET_KEY}`).toString('base64').substring(0, 16);
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: "Invalid payment session." }, { status: 403 });
      }

      // Use the provided address from request metadata (since we can't get it from Stripe)
      address = reqAddress;
      latitude = reqLat;
      longitude = reqLng;
      customerEmail = reqEmail || "promocode-user@planningchecker.co.uk"; 
    } else {
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      // Verify payment was successful
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment has not been completed." }, { status: 402 })
      }

      // Extract the securely stored address from metadata
      address = session.metadata?.address
      latitude = session.metadata?.latitude ? parseFloat(session.metadata.latitude) : undefined;
      longitude = session.metadata?.longitude ? parseFloat(session.metadata.longitude) : undefined;
      includeLandRegistry = session.metadata?.includeLandRegistry === "true";
      customerEmail = session.customer_email || session.customer_details?.email || "";
    }

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

    // Extract customer email from the session (already handled above)
    // const customerEmail = session.customer_email || session.customer_details?.email || "";

    return NextResponse.json({ ...result, propertySummary, includeLandRegistry, customerEmail })
  } catch (error: any) {
    console.error("Planning rights check error:", error)
    return NextResponse.json({ error: error.message || "Failed to check planning rights" }, { status: 500 })
  }
}
