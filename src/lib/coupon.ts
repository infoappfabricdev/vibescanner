import crypto from "crypto";

export const VALID_COUPON_CODES: Record<
  string,
  { bypassPayment: boolean }
> = {
  DEVTEST: { bypassPayment: true },
};

function getSecret(): string | undefined {
  return (
    process.env.COUPON_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim()
  );
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Buffer | null {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

export function signToken(code: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = JSON.stringify({ code });
  const payloadB64 = base64urlEncode(Buffer.from(payload, "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = base64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyCouponToken(token: string): { valid: boolean; code?: string } {
  const secret = getSecret();
  if (!secret) return { valid: false };
  const dot = token.indexOf(".");
  if (dot === -1) return { valid: false };
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  const sigBuf = base64urlDecode(sigB64);
  const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  if (!sigBuf || sigBuf.length !== expectedSig.length || !crypto.timingSafeEqual(sigBuf, expectedSig)) {
    return { valid: false };
  }
  const payloadBuf = base64urlDecode(payloadB64);
  if (!payloadBuf) return { valid: false };
  let payload: { code?: string };
  try {
    payload = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return { valid: false };
  }
  const code = payload?.code;
  if (!code || typeof code !== "string") return { valid: false };
  const entry = VALID_COUPON_CODES[code];
  if (!entry?.bypassPayment) return { valid: false };
  return { valid: true, code };
}

export function isCodeValidForBypass(code: string): boolean {
  const entry = VALID_COUPON_CODES[code];
  return Boolean(entry?.bypassPayment);
}
