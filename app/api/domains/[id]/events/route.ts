import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const eventName = searchParams.get("event_name");
  const search = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("page_size") || "25")));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["domain_id = $1"];
  const values: unknown[] = [params.id];

  if (eventName) {
    values.push(eventName);
    conditions.push(`event_name = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    conditions.push(
      `(recipient ILIKE $${idx} OR subject ILIKE $${idx} OR client_reference ILIKE $${idx} OR from_address ILIKE $${idx})`
    );
  }

  const where = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM mail_events WHERE ${where}`,
    values
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  values.push(pageSize, offset);
  const rowsResult = await query(
    `SELECT id, event_name, subject, from_address, to_addresses, client_reference,
            email_reference, recipient, reason, diagnostic_message, processed_time, received_at
     FROM mail_events
     WHERE ${where}
     ORDER BY received_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return NextResponse.json({
    events: rowsResult.rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
