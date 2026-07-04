import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeZeptoWebhook } from "@/lib/eventParser";

export async function GET() {
  // Lets you sanity-check the URL in a browser without revealing anything.
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  const domainResult = await query<{ id: number; is_active: boolean }>(
    "SELECT id, is_active FROM domains WHERE token = $1",
    [token]
  );
  const domain = domainResult.rows[0];

  // Don't distinguish "no such token" from "inactive" — both are 404 to
  // anyone probing the URL.
  if (!domain || !domain.is_active) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const events = normalizeZeptoWebhook(body);

  if (events.length > 0) {
    const cols = [
      "domain_id",
      "event_name",
      "request_id",
      "webhook_request_id",
      "subject",
      "from_address",
      "to_addresses",
      "client_reference",
      "email_reference",
      "recipient",
      "reason",
      "diagnostic_message",
      "processed_time",
      "raw_payload",
    ];
    const finalValues: unknown[] = [];
    const finalRows: string[] = [];
    events.forEach((e, i) => {
      const offset = i * cols.length;
      const placeholders = cols.map((_, j) => `$${offset + j + 1}`).join(", ");
      finalRows.push(`(${placeholders})`);
      finalValues.push(
        domain.id,
        e.event_name,
        e.request_id,
        e.webhook_request_id,
        e.subject,
        e.from_address,
        e.to_addresses,
        e.client_reference,
        e.email_reference,
        e.recipient,
        e.reason,
        e.diagnostic_message,
        e.processed_time,
        JSON.stringify(e.raw_payload)
      );
    });

    const sql = `INSERT INTO mail_events (${cols.join(", ")}) VALUES ${finalRows.join(", ")}`;
    await query(sql, finalValues);
  }

  return NextResponse.json({ ok: true, stored: events.length });
}
