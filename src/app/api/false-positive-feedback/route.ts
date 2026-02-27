import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/false-positive-feedback
 * Body: { finding_id: string, user_verdict: 'confirmed_fp' | 'not_fp', user_note?: string }
 * Verifies the finding belongs to the current user via projects join, then inserts into false_positive_feedback.
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

  let body: { finding_id?: string; user_verdict?: string; user_note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const findingId = typeof body.finding_id === "string" ? body.finding_id.trim() : "";
  const userVerdict = typeof body.user_verdict === "string" ? body.user_verdict.trim() : "";
  const userNote = typeof body.user_note === "string" ? body.user_note.trim() || null : null;

  if (!findingId) {
    return NextResponse.json({ error: "finding_id is required" }, { status: 400 });
  }
  if (userVerdict !== "confirmed_fp" && userVerdict !== "not_fp") {
    return NextResponse.json({ error: "user_verdict must be 'confirmed_fp' or 'not_fp'" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: finding, error: findError } = await admin
    .from("findings")
    .select("id, project_id, rule_id")
    .eq("id", findingId)
    .maybeSingle();

  if (findError || !finding) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", finding.project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  const { error: insertError } = await admin.from("false_positive_feedback").insert({
    finding_id: findingId,
    rule_id: finding.rule_id ?? "",
    user_verdict: userVerdict,
    user_note: userNote,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save feedback", detail: insertError.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 200 });
}
