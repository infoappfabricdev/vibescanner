import { NextRequest, NextResponse } from "next/server";
import { verifyCouponToken } from "@/lib/coupon";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || typeof token !== "string") {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const result = verifyCouponToken(token);
  return NextResponse.json({ valid: result.valid }, { status: 200 });
}
