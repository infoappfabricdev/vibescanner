import { NextRequest, NextResponse } from "next/server";
import { isCodeValidForBypass, signToken } from "@/lib/coupon";

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  if (!isCodeValidForBypass(code)) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const token = signToken(code);
  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Coupon signing not configured." },
      { status: 500 }
    );
  }
  return NextResponse.json({ valid: true, token });
}
