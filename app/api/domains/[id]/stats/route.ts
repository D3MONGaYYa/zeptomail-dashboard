import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") || "14")));

  const totalsResult = await query<{ event_name: string; count: string }>(
    `SELECT event_name, COUNT(*) AS count
     FROM mail_events
     WHERE domain_id = $1
     GROUP BY event_name
     ORDER BY count DESC`,
    [params.id]
  );

  const timeseriesResult = await query<{ day: string; event_name: string; count: string }>(
    `SELECT to_char(date_trunc('day', received_at), 'YYYY-MM-DD') AS day,
            event_name,
            COUNT(*) AS count
     FROM mail_events
     WHERE domain_id = $1
       AND received_at >= now() - ($2 || ' days')::interval
     GROUP BY day, event_name
     ORDER BY day ASC`,
    [params.id, days]
  );

  // Pivot into one row per day: { day, delivered: n, softbounce: n, ... }
  const byDay = new Map<string, Record<string, number>>();
  for (const row of timeseriesResult.rows) {
    const entry = byDay.get(row.day) ?? {};
    entry[row.event_name] = Number(row.count);
    byDay.set(row.day, entry);
  }
  const timeseries = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, counts]) => ({ day, ...counts }));

  return NextResponse.json({
    totals: totalsResult.rows.map((r) => ({ eventName: r.event_name, count: Number(r.count) })),
    timeseries,
  });
}
