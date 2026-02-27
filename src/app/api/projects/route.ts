import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ProjectItem = { id: string; name: string; created_at: string };

/**
 * GET /api/projects
 * Returns { projects: { id, name, created_at }[] } — user's projects from the projects table,
 * ordered by most recently used (latest scan per project). 401 if not authenticated.
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

  const [projectsRes, scansRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("scans")
      .select("project_id, created_at")
      .eq("user_id", user.id)
      .not("project_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const projects = (projectsRes.data ?? []) as ProjectItem[];
  const scans = (scansRes.data ?? []) as { project_id: string; created_at: string }[];

  const lastScanByProject = new Map<string, string>();
  for (const s of scans) {
    if (s.project_id && !lastScanByProject.has(s.project_id)) {
      lastScanByProject.set(s.project_id, s.created_at);
    }
  }

  const sorted = [...projects].sort((a, b) => {
    const aAt = lastScanByProject.get(a.id) ?? a.created_at;
    const bAt = lastScanByProject.get(b.id) ?? b.created_at;
    return new Date(bAt).getTime() - new Date(aAt).getTime();
  });

  return NextResponse.json({ projects: sorted });
}
