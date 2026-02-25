import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/credits
 * Returns { credits: number } for the current user. 401 if not authenticated.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("scan_credits")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ credits: data?.credits_remaining ?? 0 });
}
