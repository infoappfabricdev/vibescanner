import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCodeValidForGrantCredit } from "@/lib/coupon";

/**
 * POST /api/grant-coupon-credit
 * Body: { code: string }
 * Requires auth. If code is a valid "grant credit" coupon (e.g. DEVTEST), adds 1 credit.
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

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
  }

  if (!isCodeValidForGrantCredit(code)) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const admin = createAdminClient();
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

  return NextResponse.json({ valid: true, credited: true });
}
