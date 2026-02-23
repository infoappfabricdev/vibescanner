import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const valid = session.payment_status === "paid";
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
