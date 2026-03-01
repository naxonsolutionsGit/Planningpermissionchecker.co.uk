import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the provided test key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(request: Request) {
    try {
        const { address, latitude, longitude, includeLandRegistry } = await request.json();

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        // Determine the base URL for redirects
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "gbp",
                        product_data: {
                            name: "Professional Planning & PD Rights Screening",
                            description: `Report for: ${address.split(',')[0]}`,
                        },
                        unit_amount: 700, // £7.00 in pence
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/?canceled=true`,
            metadata: {
                address: address,
                latitude: latitude ? String(latitude) : "",
                longitude: longitude ? String(longitude) : "",
                includeLandRegistry: includeLandRegistry ? "true" : "false",
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred while creating the payment session." },
            { status: 500 }
        );
    }
}
