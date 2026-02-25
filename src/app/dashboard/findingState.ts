import type { FindingState } from "./types";

/** Single source of truth for persisted finding status (fixed/dismissed). Key by finding id; optionally prefix with user id later. */
export const VIBESCAN_FINDING_STATUS_V1 = "vibescan-finding-state";

/** Migrate legacy "dismissed" + note to new shape (notes, reason, updatedAt). */
function migrateState(parsed: Record<string, unknown>): Record<string, FindingState> {
  const out: Record<string, FindingState> = {};
  const valid: FindingState["status"][] = ["open", "fixed", "ignored", "false_positive", "other"];
  for (const [id, val] of Object.entries(parsed)) {
    if (val && typeof val === "object" && "status" in val) {
      const v = val as {
        status: string;
        dismissedReason?: string;
        dismissedNote?: string;
        note?: string;
        notes?: string;
        reason?: string | null;
        updatedAt?: string;
      };
      let status: FindingState["status"] = "open";
      if (valid.includes(v.status as FindingState["status"])) {
        status = v.status as FindingState["status"];
      } else if (v.status === "fixed") {
        status = "fixed";
      } else if (v.status === "dismissed") {
        status = v.dismissedReason === "False positive" ? "false_positive" : "ignored";
      }
      const notes = v.notes ?? v.note ?? v.dismissedNote ?? undefined;
      out[id] = {
        status,
        notes: notes || undefined,
        reason: v.reason ?? undefined,
        updatedAt: v.updatedAt ?? undefined,
      };
    }
  }
  return out;
}

export function getFindingStates(): Record<string, FindingState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VIBESCAN_FINDING_STATUS_V1);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return {};
    return migrateState(parsed);
  } catch {
    return {};
  }
}

export function setFindingState(findingId: string, state: FindingState): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getFindingStates();
    prev[findingId] = state;
    window.localStorage.setItem(VIBESCAN_FINDING_STATUS_V1, JSON.stringify(prev));
  } catch {
    // ignore
  }
}

export function getFindingState(findingId: string): FindingState | undefined {
  return getFindingStates()[findingId];
}

/** Overwrites the entire persisted store. Use for bulk updates (e.g. re-open all). */
export function setFindingStates(states: Record<string, FindingState>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIBESCAN_FINDING_STATUS_V1, JSON.stringify(states));
  } catch {
    // ignore
  }
}

/** Clears the persisted finding status store only (no scan data). Use to recover from mistakes during development. */
export function resetFindingStatusStore(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VIBESCAN_FINDING_STATUS_V1);
  } catch {
    // ignore
  }
}
