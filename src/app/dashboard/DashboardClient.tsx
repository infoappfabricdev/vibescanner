"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardClient() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: "var(--text-muted)",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </p>
  );
}
