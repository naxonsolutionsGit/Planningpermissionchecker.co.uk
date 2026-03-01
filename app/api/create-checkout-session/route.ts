import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the provided test key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(request: Request) {
    try {
        const { address, latitude, longitude, includeLandRegistry, email } = await request.json();

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        // Determine the base URL for redirects
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // Build line items
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: "PD Rights Compliance Report",
                        description: `Professional PD report for: ${address.split(',')[0]}`,
                    },
                    unit_amount: 2499, // £24.99 in pence
                },
                quantity: 1,
            },
        ];

        // Add Land Registry title as second line item if selected
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
