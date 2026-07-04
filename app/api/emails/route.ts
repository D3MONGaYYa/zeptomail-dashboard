import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domain_id");
  const search = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("page_size") || "25")));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["e.email_reference IS NOT NULL"];
  const values: unknown[] = [];

  if (domainId) {
    values.push(domainId);
    conditions.push(`e.domain_id = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    conditions.push(
      `(e.recipient ILIKE $${idx} OR e.subject ILIKE $${idx} OR e.client_reference ILIKE $${idx} OR e.email_reference ILIKE $${idx})`
    );
  }

  const where = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT e.email_reference) FROM mail_events e WHERE ${where}`,
    values
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  values.push(pageSize, offset);
  const result = await query<{
    email_reference: string;
    subject: string | null;
    from_address: string | null;
    to_addresses: string[];
    domain_id: number;
    domain_name: string;
    event_names: string[];
    event_count: string;
    first_event_at: string;
    last_event_at: string;
  }>(
    `SELECT
       e.email_reference,
       e.subject,
       e.from_address,
       e.to_addresses,
       e.domain_id,
       d.name AS domain_name,
       array_agg(DISTINCT e.event_name)::text[] AS event_names,
       COUNT(*) AS event_count,
       MIN(e.received_at) AS first_event_at,
       MAX(e.received_at) AS last_event_at
     FROM mail_events e
     JOIN domains d ON d.id = e.domain_id
     WHERE ${where}
     GROUP BY e.email_reference, e.subject, e.from_address, e.to_addresses, e.domain_id, d.name
     ORDER BY MAX(e.received_at) DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const emails = result.rows.map((r) => {
    const eventNames: string[] = r.event_names ?? [];
    const hasBounce = eventNames.some((n) =>
      ["softbounce","hardbounce","bounced","dropped"].includes(n.trim())
    );
    const hasDelivered = eventNames.some((n) => n.trim() === "delivered");
    const status = hasBounce ? "bounced" : hasDelivered ? "delivered" : "pending";

    return {
      emailRef: r.email_reference,
      subject: r.subject,
      fromAddress: r.from_address,
      toAddresses: r.to_addresses,
      domainId: r.domain_id,
      domainName: r.domain_name,
      eventNames: eventNames.map((n) => n.trim()),
      eventCount: Number(r.event_count),
      firstEventAt: r.first_event_at,
      lastEventAt: r.last_event_at,
      status,
    };
  });

  return NextResponse.json({
    emails,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
