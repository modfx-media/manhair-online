import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type TokenPayload = Record<string, string | number>;

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function signToken(payload: TokenPayload, secret: string, ttlSeconds: number, now: Date): string {
  const body = { ...payload, exp: Math.floor(now.getTime() / 1000) + ttlSeconds };
  const encoded = encode(body);
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string, secret: string, now: Date): TokenPayload | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= now.getTime()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}
