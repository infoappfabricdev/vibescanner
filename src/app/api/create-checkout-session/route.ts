import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(_request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 900,
            product_data: {
              name: "Vibe Scan",
              description: "One-time security scan. Plain-English report with fix suggestions.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/scan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Checkout failed", detail: message },
      { status: 500 }
    );
  }
}
