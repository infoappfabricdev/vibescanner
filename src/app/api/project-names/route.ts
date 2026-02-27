import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/project-names
 * Returns { projectNames: string[] } — distinct project_name from the user's scans,
 * ordered by most recently used. Excludes null/empty. 401 if not authenticated.
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

  const { data: rows } = await supabase
    .from("scans")
    .select("project_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const projectNames: string[] = [];
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    const name = typeof row.project_name === "string" ? row.project_name.trim() : "";
    if (name && !seen.has(name)) {
      seen.add(name);
      projectNames.push(name);
    }
  }

  return NextResponse.json({ projectNames });
}
