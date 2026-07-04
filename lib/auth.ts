// Minimal single-password gate for the dashboard. If DASHBOARD_PASSWORD is
// left unset, the dashboard runs open (useful for local dev / a network
// that's already behind your own auth). Set it in production.

export const SESSION_COOKIE = "mailstats_session";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

export async function computeSessionToken(): Promise<string> {
  const password = process.env.DASHBOARD_PASSWORD || "";
  const secret = process.env.SESSION_SECRET || password || "insecure-dev-secret";
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`mailstats-session:${password}`));
  return toHex(sig);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function authIsEnabled(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD);
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!authIsEnabled()) return true;
  if (!token) return false;
  const expected = await computeSessionToken();
  return timingSafeEqual(token, expected);
}

export function checkPassword(candidate: string): boolean {
  const password = process.env.DASHBOARD_PASSWORD || "";
  return password.length > 0 && timingSafeEqual(candidate, password);
}
