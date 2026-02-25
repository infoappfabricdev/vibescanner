import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Add 1 scan credit for a user when a Stripe checkout session is paid.
 * Idempotent: if session_id is already in stripe_credited_sessions, does nothing.
 * Caller must ensure the session is paid and userId is the session owner.
 */
export async function grantCreditForStripeSession(
  admin: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<{ credited: boolean; already: boolean }> {
  const { data: existing } = await admin
    .from("stripe_credited_sessions")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    return { credited: false, already: true };
  }

  await admin.from("stripe_credited_sessions").insert({ session_id: sessionId });

  const { data: row } = await admin
    .from("scan_credits")
    .select("credits_remaining")
    .eq("user_id", userId)
    .maybeSingle();

  if (row) {
    await admin
      .from("scan_credits")
      .update({
        credits_remaining: row.credits_remaining + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await admin.from("scan_credits").insert({
      user_id: userId,
      credits_remaining: 1,
      updated_at: new Date().toISOString(),
    });
  }

  return { credited: true, already: false };
}
