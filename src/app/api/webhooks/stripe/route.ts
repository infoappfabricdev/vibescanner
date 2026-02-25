import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCreditForStripeSession } from "@/lib/stripe-credit";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook: on checkout.session.completed, add 1 credit for the paying user.
 * Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   URL: https://vibescan.co/api/webhooks/stripe
 *   Events: checkout.session.completed
 * Add the signing secret to env as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const userId =
    (session.metadata?.user_id as string) || (session.client_reference_id as string) || null;
  if (!userId) {
    console.error("Stripe webhook: no user_id in session", session.id);
    return NextResponse.json({ error: "No user_id in session" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    await grantCreditForStripeSession(admin, session.id, userId);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook: failed to grant credit", err);
    return NextResponse.json(
      { error: "Failed to grant credit" },
      { status: 500 }
    );
  }
}
