import { NextResponse } from "next/server";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { findingsRowsToStoredFindings, type FindingRow } from "@/app/dashboard/types";
import type { ReportFinding } from "@/lib/semgrep-report";
import { ScanReportDocument } from "../ScanReportDocument";

export const runtime = "nodejs";

/**
 * GET /api/scan-report-pdf/[scanId]
 * Returns a PDF security report for the scan. User must be authenticated and own the scan.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await context.params;
    console.error("[scan-report-pdf] step: params resolved, scanId=", scanId);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[scan-report-pdf] step: auth ok, userId=", user.id);

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select(
        "id, created_at, project_name, notes, finding_count, critical_count, high_count, medium_count, low_count, findings"
      )
      .eq("id", scanId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (scanError || !scan) {
      console.error("[scan-report-pdf] step: scan not found, error=", scanError?.message);
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }
    console.error("[scan-report-pdf] step: scan loaded, project_name=", scan.project_name ?? "(null)");

    const { data: findingsRows } = await supabase
      .from("findings")
      .select(
        "id, project_id, scan_id, rule_id, scanner, file_path, line, title, explanation, severity, status, false_positive_likelihood, false_positive_reason, first_seen_at, last_seen_at, resolved_at, summary_text, details_text, fix_prompt, why_it_matters, fix_suggestion"
      )
      .eq("scan_id", scanId)
      .order("first_seen_at", { ascending: true });

    const findings =
      findingsRows != null && findingsRows.length > 0
        ? findingsRowsToStoredFindings(findingsRows as FindingRow[])
        : ((scan.findings ?? []) as ReportFinding[]).map((f) => ({
            ...f,
            summaryText: undefined,
            detailsText: undefined,
            false_positive_likelihood: undefined,
            false_positive_reason: undefined,
          }));
    console.error("[scan-report-pdf] step: findings loaded, count=", findings.length);

    const doc = React.createElement(ScanReportDocument, {
      scan: {
        project_name: scan.project_name,
        created_at: scan.created_at,
        notes: scan.notes,
        finding_count: scan.finding_count,
        critical_count: scan.critical_count,
        high_count: scan.high_count,
        medium_count: scan.medium_count,
        low_count: scan.low_count,
      },
      findings,
    });

    let buffer: Buffer;
    const pdfModule = await import("@react-pdf/renderer");
    const { renderToBuffer, renderToStream } = pdfModule as typeof pdfModule & {
      renderToBuffer?: (el: React.ReactElement) => Promise<Buffer>;
    };

    if (typeof renderToBuffer === "function") {
      console.error("[scan-report-pdf] step: using renderToBuffer");
      try {
        buffer = await renderToBuffer(doc as React.ReactElement);
        console.error("[scan-report-pdf] step: renderToBuffer done, buffer length=", buffer.length);
      } catch (renderErr) {
        console.error("[scan-report-pdf] renderToBuffer failed:", renderErr);
        if (renderErr instanceof Error) console.error("[scan-report-pdf] renderToBuffer stack:", renderErr.stack);
        throw renderErr;
      }
    } else {
      console.error("[scan-report-pdf] step: using renderToStream (renderToBuffer not available)");
      try {
        const stream = await renderToStream(doc as React.ReactElement);
        console.error("[scan-report-pdf] step: renderToStream returned");
        buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          stream.on("end", () => {
            console.error("[scan-report-pdf] step: stream end, chunks=", chunks.length);
            resolve(Buffer.concat(chunks));
          });
          stream.on("error", (err: Error) => {
            console.error("[scan-report-pdf] stream error:", err);
            reject(err);
          });
        });
        console.error("[scan-report-pdf] step: buffer from stream, length=", buffer.length);
      } catch (streamErr) {
        console.error("[scan-report-pdf] renderToStream/stream failed:", streamErr);
        if (streamErr instanceof Error) console.error("[scan-report-pdf] stream stack:", streamErr.stack);
        throw streamErr;
      }
    }

    console.error("[scan-report-pdf] step: returning PDF response, size=", buffer.length);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vibescan-report-${scanId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/scan-report-pdf] error:", err);
    if (err instanceof Error) {
      console.error("[GET /api/scan-report-pdf] message:", err.message);
      console.error("[GET /api/scan-report-pdf] stack:", err.stack);
    }
    // Temporary: return actual error in body for debugging (browser console)
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
