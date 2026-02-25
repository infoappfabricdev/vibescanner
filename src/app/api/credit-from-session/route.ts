import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCreditForStripeSession } from "@/lib/stripe-credit";

/**
 * POST /api/credit-from-session
 * Body: { session_id: string }
 * Requires auth. Verifies Stripe session is paid and owned by the current user, then adds 1 credit once per session.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : null;
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let session: Stripe.Checkout.Session;
  try {
    const stripe = new Stripe(secretKey);
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
  }

  const sessionUserId =
    (session.metadata?.user_id as string) || session.client_reference_id || null;
  if (sessionUserId !== user.id) {
    return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
  }

  const admin = createAdminClient();
  const result = await grantCreditForStripeSession(admin, sessionId, user.id);

  return NextResponse.json({
    credited: result.credited,
    already: result.already,
  });
}
