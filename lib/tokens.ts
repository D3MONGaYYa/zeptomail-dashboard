import { customAlphabet } from "nanoid";

// Lowercase letters + digits, no ambiguous-looking separators — easy to paste
// into ZeptoMail's webhook URL field without confusion.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const generate = customAlphabet(alphabet, 24);

export function generateWebhookToken(): string {
  return generate();
}

export function buildWebhookUrl(token: string): string {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  return `${base}/hooks/${token}`;
}
