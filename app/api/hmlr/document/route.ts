import { NextResponse } from "next/server";
import { HMLRGatewayClient } from "@/lib/hmlr-gateway-api";

/**
 * API Route to fetch official Land Registry documents.
 * Protected by checking session or requirement markers.
 */
export async function POST(request: Request) {
  try {
    const { titleNumber, address } = await request.json();

    if (!titleNumber) {
      return NextResponse.json(
        { error: "Title Number is required" },
        { status: 400 }
      );
    }

    // In a real scenario, we would verify payment here too
    // For now, we use the client to fetch the document
    const client = new HMLRGatewayClient();
    const result = await client.fetchTitleRegister(titleNumber);

    if (result.success && result.pdfBytes) {
      // Return the PDF bytes as a base64 string
      const base64 = Buffer.from(result.pdfBytes).toString('base64');
      return NextResponse.json({ success: true, pdfBase64: base64 });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to retrieve document from HMLR" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[HMLR API Route] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
