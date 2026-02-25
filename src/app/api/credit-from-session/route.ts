import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/credit-from-session
 * Body: { session_id: string }
 * Requires auth. Verifies Stripe session is paid, then adds 1 credit once per session.
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

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("stripe_credited_sessions")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ credited: true, already: true });
  }

  await admin.from("stripe_credited_sessions").insert({ session_id: sessionId });

  const { data: row } = await admin
    .from("scan_credits")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();

  if (row) {
    await admin
      .from("scan_credits")
      .update({
        credits_remaining: row.credits_remaining + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  } else {
    await admin.from("scan_credits").insert({
      user_id: user.id,
      credits_remaining: 1,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ credited: true });
}
