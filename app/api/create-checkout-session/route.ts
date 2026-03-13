import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the provided test key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(request: Request) {
    try {
        const { address, latitude, longitude, includeLandRegistry, email, promoCode } = await request.json();

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        // Promocode logic
        let discountPercent = 0;
        if (promoCode) {
            const code = String(promoCode).toUpperCase();
            if (code === "FREE100") discountPercent = 100;
            else if (code === "SAVE50") discountPercent = 50;
            else if (code === "GET20") discountPercent = 20;
            // Add more codes as needed
        }

        // Determine the base URL for redirects
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // Handle 100% discount bypass
        if (discountPercent === 100) {
            const timestamp = Date.now();
            // Simple signature for verification
            const signature = Buffer.from(`${timestamp}-${process.env.STRIPE_SECRET_KEY}`).toString('base64').substring(0, 16);
            const bypassSessionId = `FREE_BYPASS_${timestamp}_${signature}_${Buffer.from(address).toString('base64').substring(0, 8)}`;
            
            return NextResponse.json({ 
                url: `${baseUrl}/?session_id=${bypassSessionId}` 
            });
        }

        // Build line items with potential discount
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: "PD Rights Compliance Report",
                        description: `Professional PD report for: ${address.split(',')[0]}${discountPercent > 0 ? ` (${discountPercent}% discount applied)` : ''}`,
                    },
                    unit_amount: Math.round(2499 * (1 - discountPercent / 100)), // Apply discount
                },
                quantity: 1,
            },
        ];

        // Add Land Registry title as second line item if selected (usually not discounted, but we can if requested)
        if (includeLandRegistry) {
            line_items.push({
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: "Official Land Registry Title",
                        description: "HM Land Registry Title Register & Title Plan",
                    },
                    unit_amount: 700, // £7.00 in pence
                },
                quantity: 1,
            });
        }

        // Create Checkout Session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/?canceled=true`,
            metadata: {
                address: address,
                latitude: latitude ? String(latitude) : "",
                longitude: longitude ? String(longitude) : "",
                includeLandRegistry: includeLandRegistry ? "true" : "false",
                promoCode: promoCode || "",
                discountApplied: String(discountPercent),
            },
        };

        // Add customer email if provided
        if (email) {
            sessionParams.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred while creating the payment session." },
            { status: 500 }
        );
    }
}
