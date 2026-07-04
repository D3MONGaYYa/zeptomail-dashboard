import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateWebhookToken, buildWebhookUrl } from "@/lib/tokens";

export async function GET() {
  const result = await query<{
    id: number;
    name: string;
    token: string;
    is_active: boolean;
    created_at: string;
    total_events: string;
    bounce_events: string;
    last_event_at: string | null;
  }>(
    `SELECT
        d.id, d.name, d.token, d.is_active, d.created_at,
        COUNT(e.id) AS total_events,
        COUNT(e.id) FILTER (WHERE e.event_name IN ('softbounce','hardbounce','bounced','dropped')) AS bounce_events,
        MAX(e.received_at) AS last_event_at
     FROM domains d
     LEFT JOIN mail_events e ON e.domain_id = d.id
     GROUP BY d.id
     ORDER BY d.created_at DESC`
  );

  const domains = result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    webhookUrl: buildWebhookUrl(r.token),
    isActive: r.is_active,
    createdAt: r.created_at,
    totalEvents: Number(r.total_events),
    bounceEvents: Number(r.bounce_events),
    lastEventAt: r.last_event_at,
  }));

  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().toLowerCase() : "";

  if (!name) {
    return NextResponse.json({ error: "Domain name is required." }, { status: 400 });
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(name)) {
    return NextResponse.json({ error: "That doesn't look like a valid domain." }, { status: 400 });
  }

  const token = generateWebhookToken();

  try {
    const result = await query<{ id: number; created_at: string }>(
      `INSERT INTO domains (name, token) VALUES ($1, $2) RETURNING id, created_at`,
      [name, token]
    );
    const row = result.rows[0];
    return NextResponse.json(
      {
        id: row.id,
        name,
        token,
        webhookUrl: buildWebhookUrl(token),
        createdAt: row.created_at,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === "23505") {
      return NextResponse.json({ error: "That domain is already being tracked." }, { status: 409 });
    }
    throw err;
  }
}
